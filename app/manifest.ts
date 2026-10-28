import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
return {
id: '/',
name: 'iSports',
short_name: 'iSports',
description: 'Manage sports events, teams, tournaments, and live scores.',
start_url: '/',
scope: '/',
display: 'standalone',
background_color: '#ffffff',
theme_color: '#16a34a',
orientation: 'portrait',
categories: ['sports'],
icons: [
{
src: '/Icon-192.png',
sizes: '192x192',
type: 'image/png',
},
{
src: '/Icon-512.png',
sizes: '512x512',
type: 'image/png',
},
],
}
}