import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { SmartImage } from './SmartImage';

export function Gallery({ images, title, featured = false }: { images: string[]; title: string; featured?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    if (selected === null) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
      if (event.key === 'ArrowRight') setSelected((selected + 1) % images.length);
      if (event.key === 'ArrowLeft') setSelected((selected - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handler); document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [selected, images.length]);
  return <>
    <div className={`gallery-grid ${featured ? 'gallery-grid--featured' : ''}`}>{images.map((image, index) => <button key={image} onClick={() => setSelected(index)} aria-label={`Увеличить изображение ${index + 1}`}><SmartImage src={image} alt={`${title}, изображение ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} /></button>)}</div>
    {selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр галереи">
      <button className="lightbox-close" onClick={() => setSelected(null)} aria-label="Закрыть"><Icon name="close" /></button>
      <button className="lightbox-nav lightbox-nav--prev" onClick={() => setSelected((selected - 1 + images.length) % images.length)} aria-label="Предыдущее изображение">‹</button>
      <SmartImage src={images[selected]} alt={`${title}, изображение ${selected + 1}`} />
      <button className="lightbox-nav lightbox-nav--next" onClick={() => setSelected((selected + 1) % images.length)} aria-label="Следующее изображение">›</button>
      <span>{selected + 1} / {images.length}</span>
    </div>}
  </>;
}
