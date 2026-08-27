package com.internship.management.service;

import com.internship.management.entity.InternshipRequest;
import com.internship.management.entity.StudentProfile;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Builds the internship certificate as a PDF matching the organization's
 * official layout (logo block, institutional header, formal attestation
 * paragraph, signature block, footnote).
 */
@Component
public class CertificatePdfGenerator {

    private static final String[] FRENCH_MONTHS_ABBR = {
            "JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN",
            "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"
    };

    private static final DateTimeFormatter SHORT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // These reflect the organization's own letterhead wording — adjust here if
    // the issuing office/department changes.
    private static final String ISSUING_OFFICE = "Le responsable développement RH de Laâyoune du Groupe OCP S.A";
    private static final String ISSUING_CITY = "Laâyoune";
    private static final String DOCUMENT_CODE_PREFIX = "MIB/H/D";

    public byte[] generate(InternshipRequest request, StudentProfile studentProfile, String referenceNumber, LocalDate issuedDate) {
        try {
            Document document = new Document(PageSize.A4, 70, 70, 90, 70);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Font institutionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font refFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 11.5f);
            Font bodyBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11.5f);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f);
            Font signFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            document.add(buildHeader(institutionFont, refFont, referenceNumber));
            document.add(new Paragraph(" "));

            Paragraph title = new Paragraph("ATTESTATION DE STAGE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(16);
            title.setSpacingAfter(28);
            document.add(title);

            document.add(buildBody(request, studentProfile, bodyFont, bodyBoldFont));
            document.add(new Paragraph(" "));

            Paragraph closing = new Paragraph(
                    "La présente attestation est délivrée à l'intéressé(e) sur sa demande pour "
                            + "servir et valoir ce que de droit.",
                    bodyFont);
            closing.setAlignment(Element.ALIGN_JUSTIFIED);
            closing.setSpacingAfter(50);
            document.add(closing);

            document.add(buildSignatureBlock(issuedDate, bodyFont, signFont, smallFont));
            document.add(new Paragraph(" "));

            Paragraph nb = new Paragraph(
                    "NB : Une seule attestation de stage est délivrée par période de stage.",
                    smallFont);
            nb.setSpacingBefore(50);
            document.add(nb);

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new RuntimeException("Impossible de générer le PDF de l'attestation", e);
        }
    }

    private PdfPTable buildHeader(Font institutionFont, Font refFont, String referenceNumber) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 2.2f});

        // Logo placeholder — swap for an actual image (Image.getInstance(path))
        // once a real logo asset is available.
        PdfPCell logoCell = new PdfPCell(new Paragraph("OCP", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22)));
        logoCell.setBorder(Rectangle.BOX);
        logoCell.setFixedHeight(52f);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(logoCell);

        PdfPCell textCell = new PdfPCell();
        textCell.setBorder(Rectangle.NO_BORDER);
        textCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        textCell.addElement(new Paragraph("CAPITAL HUMAIN", institutionFont));
        textCell.addElement(new Paragraph("FORMATION ET GESTION DES COMPETENCES", institutionFont));
        textCell.addElement(new Paragraph(DOCUMENT_CODE_PREFIX + " - N° " + referenceNumber, refFont));
        table.addCell(textCell);

        return table;
    }

    private Paragraph buildBody(InternshipRequest request, StudentProfile profile, Font bodyFont, Font boldFont) {
        String fullName = request.getStudent() != null
                ? request.getStudent().getFullName()
                : request.getApplicantDisplayName();
        String school = profile != null && profile.getSchool() != null ? profile.getSchool() : "—";
        String levelYear = buildLevelYear(profile);
        String filiere = request.getSpecialty() != null && !request.getSpecialty().isBlank() ? request.getSpecialty() : "—";
        String internshipType = request.getInternshipType() != null && !request.getInternshipType().isBlank()
                ? request.getInternshipType() : "stage";
        String startStr = request.getStartDate() != null ? request.getStartDate().format(SHORT_DATE) : "—";
        String endStr = request.getEndDate() != null ? request.getEndDate().format(SHORT_DATE) : "—";

        Paragraph body = new Paragraph();
        body.setAlignment(Element.ALIGN_JUSTIFIED);
        body.setLeading(20f);
        body.add(new Chunk(ISSUING_OFFICE + " ", bodyFont));
        body.add(new Chunk("certifie que ", bodyFont));
        body.add(new Chunk("Monsieur/Madame " + fullName, boldFont));
        body.add(new Chunk(",\nétudiant(e) à ", bodyFont));
        body.add(new Chunk(school, boldFont));
        body.add(new Chunk(", " + levelYear + ",\n", bodyFont));
        body.add(new Chunk(filiere, boldFont));
        body.add(new Chunk(", a effectué avec assiduité un stage ", bodyFont));
        body.add(new Chunk(internshipType, boldFont));
        body.add(new Chunk(" du " + startStr + " au " + endStr + ".", bodyFont));
        return body;
    }

    private Paragraph buildSignatureBlock(LocalDate issuedDate, Font bodyFont, Font signFont, Font smallFont) {
        Paragraph sig = new Paragraph();
        sig.setAlignment(Element.ALIGN_RIGHT);
        sig.setLeading(18f);
        sig.add(new Chunk(ISSUING_CITY + ", le " + formatIssuedDate(issuedDate) + "\n", bodyFont));
        sig.add(new Chunk("LE RESPONSABLE\n", signFont));
        sig.add(new Chunk("DEVELOPPEMENT RH\n\n\n", signFont));
        // Placeholders — swap for real signature/stamp images once available.
        sig.add(new Chunk("(signature)\n", smallFont));
        sig.add(new Chunk("(cachet)", smallFont));
        return sig;
    }

    private String buildLevelYear(StudentProfile profile) {
        if (profile == null) return "—";
        String level = profile.getLevel() != null ? profile.getLevel() : "";
        String year = profile.getAcademicYear() != null ? profile.getAcademicYear() : "";
        if (!level.isBlank() && !year.isBlank()) return level + " / " + year;
        if (!level.isBlank()) return level;
        if (!year.isBlank()) return year;
        return "—";
    }

    private String formatIssuedDate(LocalDate date) {
        LocalDate d = date != null ? date : LocalDate.now();
        return String.format("%02d", d.getDayOfMonth()) + " " + FRENCH_MONTHS_ABBR[d.getMonthValue() - 1] + " " + d.getYear();
    }
}
