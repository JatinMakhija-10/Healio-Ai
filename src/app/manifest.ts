import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Arovia.AI - Where Science Meets Soul',
        short_name: 'Arovia.AI',
        description: 'Personalized wellness guidance, Ayurvedic home remedies, homeopathic context, and connected wearable health telemetry for Indian families.',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#0F172A',
        theme_color: '#0F766E',
        orientation: 'portrait',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
        categories: ['health', 'medical', 'lifestyle'],
        shortcuts: [
            {
                name: 'New Consultation',
                url: '/dashboard/consult',
                description: 'Start a new clinical consultation',
            },
            {
                name: 'Health Sync & Wearables',
                url: '/dashboard/health-sync',
                description: 'Sync Apple Health, Google Health Connect, and phone sensors',
            },
            {
                name: 'Consultation History',
                url: '/dashboard/history',
                description: 'View past health assessments',
            },
        ],
    };
}
