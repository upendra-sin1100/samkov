type Application = {id:string; track_slug:string; status:string};

export function selectApplication<T extends Application>(applications:T[], path:string, selectedId:string):T|undefined {
 if(/^\/(tasks|learn|submit|apply|internships)\//.test(path)) {
  return applications.find(application=>application.track_slug===path.split('/')[2]);
 }
 return applications.find(application=>application.id===selectedId)
  || applications.find(application=>['approved','completed'].includes(application.status))
  || applications[0];
}

export function certificatesForApplication<T extends {application_id:string}>(certificates:T[], applicationId?:string):T[] {
 return certificates.filter(certificate=>certificate.application_id===applicationId);
}

export function certificateIdFromPath(path:string):string {
 try { return decodeURIComponent(path.split('/')[2]||''); }
 catch { return ''; }
}
