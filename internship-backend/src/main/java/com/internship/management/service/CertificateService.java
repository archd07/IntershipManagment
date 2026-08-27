package com.internship.management.service;

import com.internship.management.entity.Certificate;
import com.internship.management.entity.InternshipRequest;
import com.internship.management.entity.NotificationPriority;
import com.internship.management.entity.RequestStatus;
import com.internship.management.entity.StudentProfile;
import com.internship.management.repository.CertificateRepository;
import com.internship.management.repository.InternshipRequestRepository;
import com.internship.management.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final InternshipRequestRepository requestRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final NotificationService notificationService;
    private final CertificatePdfGenerator pdfGenerator;

    @Value("${app.storage.certificates-dir}")
    private String certificatesDir;

    @Transactional
    public Certificate generate(Long internshipRequestId) {
        InternshipRequest request = requestRepository.findById(internshipRequestId)
                .orElseThrow(() -> new RuntimeException("Demande de stage introuvable"));

        if (request.getStatus() != RequestStatus.COMPLETED) {
            throw new IllegalStateException("L'attestation ne peut être générée que pour un stage terminé");
        }

        Certificate certificate = certificateRepository.findByInternshipRequestId(internshipRequestId)
                .orElse(Certificate.builder().internshipRequest(request).build());

        // Save once first so a brand-new certificate has a database id to build
        // a stable reference number from (N° <id>/<yy>, e.g. "N° 656/26").
        certificate = certificateRepository.save(certificate);
        if (certificate.getReferenceNumber() == null) {
            String yearSuffix = String.valueOf(LocalDate.now().getYear()).substring(2);
            certificate.setReferenceNumber(certificate.getId() + "/" + yearSuffix);
        }
        certificate.setIssuedDate(LocalDate.now());

        StudentProfile profile = request.getStudent() != null
                ? studentProfileRepository.findByUserId(request.getStudent().getId()).orElse(null)
                : null;

        byte[] pdfBytes = pdfGenerator.generate(request, profile, certificate.getReferenceNumber(), certificate.getIssuedDate());
        String filePath = writePdfToDisk(certificate.getReferenceNumber(), pdfBytes);
        certificate.setFilePath(filePath);

        Certificate saved = certificateRepository.save(certificate);

        notificationService.notify(request.getStudent(), "Attestation disponible",
                "Votre attestation de stage (" + certificate.getReferenceNumber() + ") est maintenant disponible.",
                NotificationPriority.HIGH, "CERTIFICATE");

        return saved;
    }

    public Certificate getForRequest(Long internshipRequestId) {
        return certificateRepository.findByInternshipRequestId(internshipRequestId)
                .orElseThrow(() -> new RuntimeException("Attestation introuvable"));
    }

    /** Reads the certificate PDF bytes back from disk for download. */
    public byte[] getPdfBytes(Long internshipRequestId) {
        Certificate certificate = getForRequest(internshipRequestId);
        try {
            return Files.readAllBytes(Path.of(certificate.getFilePath()));
        } catch (IOException e) {
            throw new RuntimeException("Impossible de lire le fichier de l'attestation", e);
        }
    }

    private String writePdfToDisk(String referenceNumber, byte[] pdfBytes) {
        try {
            Path dir = Path.of(certificatesDir);
            Files.createDirectories(dir);
            String safeName = referenceNumber.replace("/", "-") + ".pdf";
            Path file = dir.resolve(safeName);
            Files.write(file, pdfBytes);
            return file.toAbsolutePath().toString();
        } catch (IOException e) {
            throw new RuntimeException("Impossible d'enregistrer le fichier de l'attestation", e);
        }
    }
}
