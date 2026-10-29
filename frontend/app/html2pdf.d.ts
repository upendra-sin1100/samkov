declare module 'html2pdf.js' {
    const html2pdf: () => {
        set(options: object): {
            from(element: Element): {
                save(): Promise<void>;
            };
        };
    };
    export default html2pdf;
}
