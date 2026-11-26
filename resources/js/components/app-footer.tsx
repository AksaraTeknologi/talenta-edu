import { useTranslation } from 'react-i18next';
import { Link } from '@inertiajs/react';
import { Instagram } from 'lucide-react';

export default function AppFooter() {
    const { t } = useTranslation('common');
    return (
        <footer className="w-full border-t border-[#1E4768] bg-[#12344E] pt-12 pb-24 text-slate-200 lg:pb-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-9">
                    {/* Column 1: Logo and Description */}
                    <div className="flex flex-col lg:col-span-4">
                        <div className="mb-5">
                            <Link href="/" className="inline-flex items-center rounded-lg bg-white px-3.5 py-2 shadow-xs">
                                <img src="/assets/images/logo-primary-2.png" alt="Talenta Academy" className="h-8 sm:h-9" />
                            </Link>
                        </div>
                        <p className="mb-5 max-w-md text-sm leading-relaxed text-slate-300">
                            {t('footer.tagline', 'Mencetak Talenta Akuntansi & Pajak yang Siap Dunia Kerja')}
                        </p>
                        <div>
                            <h5 className="mb-1.5 text-sm font-semibold text-white">{t('footer.company', 'Talenta Academy')}</h5>
                            <p className="text-sm leading-relaxed text-slate-300">
                                Perumahan Permata Permadani, Blok B1. Kel. Pendem Kec. Junrejo
                                <br />
                                Kota Batu Prov. Jawa Timur, 65324
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">
                        {/* Column 2: Menu */}
                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{t('footer.menu', 'Menu')}</h4>
                            <ul className="space-y-2.5">
                                <li>
                                    <Link href="/" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('nav.home', 'Beranda')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/program" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('nav.programsAndServices', 'Program & Layanan')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/galeri" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('nav.publications', 'Publikasi')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('footer.links.about', t('nav.about', 'Tentang Kami'))}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Services */}
                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{t('footer.services', 'Layanan')}</h4>
                            <ul className="space-y-2.5">
                                <li>
                                    <Link href="/bootcamp" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('nav.bootcamp', 'Bootcamp')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/webinar" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('nav.webinar', 'Webinar')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/course" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('nav.course', 'Kelas Online')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('footer.links.bundle', 'Bundling Class')}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 4: Others */}
                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{t('footer.others', 'Lainnya')}</h4>
                            <ul className="space-y-2.5">
                                <li>
                                    <Link href="/terms-and-conditions" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('footer.links.terms', 'Syarat & Ketentuan')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy-policy" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('footer.links.privacy', 'Kebijakan Privasi')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/publication" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('footer.links.article', 'Artikel & Blog')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about" className="text-sm text-slate-300 transition-colors hover:text-white hover:underline">
                                        {t('footer.links.about', t('nav.about', 'Tentang Kami'))}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="lg:col-span-2">
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{t('footer.social', 'Media Sosial')}</h4>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://www.instagram.com/brevetpajak_talenta/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram Talenta Academy"
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-[#12344E]"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.tiktok.com/@brevetpajak_talenta"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="TikTok Talenta Academy"
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-[#12344E]"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                </svg>
                            </a>
                            <a
                                href="https://wa.me/+6285606391730"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp Talenta Academy"
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-[#12344E]"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="my-8 h-px bg-white/15" />

                {/* Copyright */}
                <div className="text-center">
                    <p className="text-xs font-medium text-slate-300 sm:text-sm">
                        {t('footer.copyright', 'Copyright © Talentaacademy, All rights reserved.')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
