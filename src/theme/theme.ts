export const theme = {
    colors: {
        background: '#000000',
        card: '#151517',
        cardActive: '#1C1C1E',
        element: '#2C2C2E',
        text: '#FFFFFF',
        textSecondary: '#8E8E93',
        textTertiary: '#636366',
        primary: '#4CD964', // Neon Green
        secondary: '#0A84FF', // Neon Blue
        success: '#4CD964',
        error: '#FF3B30',
        warning: '#FFCC00',
        gray: '#2C2C2E',
        darkGray: '#8E8E93',
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    typography: {
        header: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#FFFFFF',
        },
        subHeader: {
            fontSize: 18,
            fontWeight: '600',
            color: '#8E8E93',
        },
        body: {
            fontSize: 16,
            color: '#FFFFFF',
        },
        button: {
            fontSize: 17,
            fontWeight: '600',
            color: '#000000',
        },
    },
    borderRadius: {
        s: 8,
        m: 14,
        l: 20,
        xl: 32,
    },
} as const;
