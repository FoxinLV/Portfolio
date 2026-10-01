import { useState, type ImgHTMLAttributes } from 'react';
import { Icon } from './Icon';

export function SmartImage({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed || !props.src) return <div className={`image-placeholder ${className}`} role="img" aria-label={props.alt || 'Изображение недоступно'}><Icon name="image" /></div>;
  return <img className={className} {...props} onError={() => setFailed(true)} />;
}
