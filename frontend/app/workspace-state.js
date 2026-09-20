export function selectApplication(applications, path, selectedId) {
    if (/^\/(tasks|learn|submit|apply|internships)\//.test(path)) {
        return applications.find(application => application.track_slug === path.split('/')[2]);
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
