export declare const getCajas: () => Promise<any>;
export declare const appendToSheet: (data: any) => Promise<void>;
export declare const getSummary: () => Promise<{
    ingresos: number;
    egresos: number;
    balance: number;
    totalRegistros: number;
    ultimosMovimientos: any[];
    saldosPorCaja: {
        [key: string]: number;
    };
}>;
export declare const addCaja: (nombre: string) => Promise<void>;
//# sourceMappingURL=google-sheets.service.d.ts.map