// Include signed-up accounts even when they have no internship application.
export function directoryEntries(records) {
    const users = records.users || [];
    const applications = records.applications || [];
    const enrolled = new Set(applications.map(a => a.user_id));
    return [
        ...applications.map(a => {
            const profile = users.find(u => u.id === a.user_id);
            return {...a, student_name: profile?.display_name || profile?.username || a.student_name,
                username: profile?.username || ''};
        }),
        ...users.filter(u => !enrolled.has(u.id)).map(u => ({
            id: `account-${u.id}`, user_id: u.id,
            student_name: u.display_name || u.username || u.email || 'Unnamed account',
            username: u.username || '', email: u.email, track_slug: null,
            status: u.role === 'admin' ? 'Administrator' : 'Not enrolled',
        })),
    ];
}
