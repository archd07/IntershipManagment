package com.internship.management.dto;

import com.internship.management.entity.InternshipRequest;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned to the administrator when viewing a request's detail.
 * studentPendingTemporaryPassword persists across page reloads / re-selections
 * — it stays populated (for requests that just had a student account created
 * on acceptance) until that student actually logs in and changes their
 * password, at which point it becomes null and disappears from the admin's view.
 */
@Data
@AllArgsConstructor
public class AdminRequestDetailDto {
    private InternshipRequest request;
    private String studentPendingTemporaryPassword;
}
