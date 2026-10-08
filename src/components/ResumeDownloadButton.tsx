import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { downloadResumePdf } from '../utils/resumePdf';
import { Icon } from './Icon';

export function ResumeDownloadButton() {
  const { profile, career, education, profileLoading, careerLoading, educationLoading } = usePortfolio();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const loading = profileLoading || careerLoading || educationLoading;
  const unavailable = loading || !profile || !career;

  async function download() {
    if (!profile || !career || generating) return;
    setGenerating(true);
    setError('');
    try {
      await downloadResumePdf({ profile, career, education });
    } catch (reason) {
      console.error(reason);
      setError('Не удалось сформировать PDF. Попробуйте ещё раз.');
    } finally {
      setGenerating(false);
    }
  }

  return <button
    type="button"
    className="button button--primary resume-download-button"
    disabled={unavailable || generating}
    onClick={download}
    title={error || (loading ? 'Загружаются данные резюме' : undefined)}
    aria-busy={generating}
  >
    <Icon name="download" />
    {generating ? 'Формируем PDF…' : loading ? 'Загружаем резюме…' : 'Скачать резюме из данных сайта'}
  </button>;
}
