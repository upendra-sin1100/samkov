export function selectApplication(applications, path, selectedId) {
    if (/^\/(dashboard|offer|certificate|tasks|learn|submit|apply|internships)\//.test(path)) {
        return applications.find(application => application.track_slug === path.split('/')[2]);
    }
    if (path === '/dashboard') {
        const active = applications.filter(a => ['approved', 'pending'].includes(a.status));
        return active.length === 1 ? active[0] : undefined;
    }
    return applications.find(application => application.id === selectedId)
        || applications.find(application => ['approved', 'completed'].includes(application.status))
        || applications[0];
}
export function certificatesForApplication(certificates, applicationId) {
    return certificates.filter(certificate => certificate.application_id === applicationId);
}
export function certificateIdFromPath(path) {
    try {
        return decodeURIComponent(path.split('/')[2] || '');
    }
    catch {
        return '';
    }
}
