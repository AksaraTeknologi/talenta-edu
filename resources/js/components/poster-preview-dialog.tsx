import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PosterPreviewDialogProps {
    src?: string;
    title: string;
}

export function PosterPreviewDialog({ src, title }: PosterPreviewDialogProps) {
    const { t } = useTranslation('user');
    const imageSrc = src || '/assets/images/placeholder.png';

    return (
        <Dialog>
            <div className="relative overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-3">
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="group relative flex w-full cursor-zoom-in items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-[#1976D3] focus-visible:outline-none"
                        aria-label={t('webinar.detail.zoomPoster', 'Perbesar Poster')}
                    >
                        <img
                            src={imageSrc}
                            alt={title}
                            className="max-h-[260px] w-full rounded-lg object-contain sm:max-h-[300px]"
                        />
                    </button>
                </DialogTrigger>
                <div className="mt-2.5 flex justify-end">
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium">
                            <ZoomIn className="h-3.5 w-3.5" />
                            {t('webinar.detail.zoomPoster', 'Perbesar Poster')}
                        </Button>
                    </DialogTrigger>
                </div>
            </div>

            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-white p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="pr-8 text-base font-semibold text-[#12344E]">{title}</DialogTitle>
                </DialogHeader>
                <div className="mt-2 flex items-center justify-center rounded-lg bg-[#F2F6FA] p-2">
                    <img src={imageSrc} alt={title} className="max-h-[75vh] w-auto rounded-md object-contain" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
