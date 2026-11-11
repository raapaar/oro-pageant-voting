/** The identity comes only from the platform-verified request headers. */
export function isAdminIdentity(email: string | undefined, configuredEmail: string | undefined): boolean {
    return !!email && !!configuredEmail?.trim() && email.trim().toLowerCase() === configuredEmail.trim().toLowerCase();
}
