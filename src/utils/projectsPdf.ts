import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Career, CareerEngagement, CareerOrganization, CareerProjectAssignment } from '../types/career';
import type { Profile } from '../types/profile';
import type { Project, ProjectTechnology } from '../types/project';
import { technologyIconUrl, technologyValue } from './projectTechnology';
import { projectAssetUrl } from './storageUrl';

export interface ProjectPdfProgress {
  message: string;
  value: number;
}

interface ProjectPdfSource {
  projects: Project[];
  career: Career | null;
  profile: Profile | null;
  onProgress?: (progress: ProjectPdfProgress) => void;
}

interface CareerContext {
  assignment: CareerProjectAssignment;
  engagement: CareerEngagement;
  organization: CareerOrganization;
}

interface ProjectAssets {
  cover?: string;
  gallery: string[];
  technologyIcons: Map<string, string>;
}

const assetCache = new Map<string, Promise<string | undefined>>();

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function careerPeriod(assignment: CareerProjectAssignment, engagement: CareerEngagement) {
  const start = assignment.startDate || engagement.startDate;
  const end = assignment.endDate === undefined ? engagement.endDate : assignment.endDate;
  return `${monthLabel(start)} - ${end ? monthLabel(end) : 'настоящее время'}`;
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function projectsCountLabel(count: number) {
  const modulo100 = count % 100;
  const modulo10 = count % 10;
  const noun = modulo100 >= 11 && modulo100 <= 14
    ? 'проектов'
    : modulo10 === 1
      ? 'проект'
      : modulo10 >= 2 && modulo10 <= 4
        ? 'проекта'
        : 'проектов';
  return `${count} ${noun}`;
}

async function imageElement(blob: Blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Изображение не декодировано'));
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function rasterize(url: string, icon = false): Promise<string | undefined> {
  const cacheKey = `${icon ? 'icon' : 'image'}:${url}`;
  if (!assetCache.has(cacheKey)) assetCache.set(cacheKey, (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return undefined;
      const image = await imageElement(await response.blob());
      const maxWidth = icon ? 96 : 1500;
      const maxHeight = icon ? 96 : 1100;
      const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) return undefined;
      if (!icon) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return icon ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.84);
    } catch {
      return undefined;
    }
  })());
  return assetCache.get(cacheKey)!;
}

async function loadAssets(project: Project): Promise<ProjectAssets> {
  const coverUrl = project.cover ? projectAssetUrl(project.storagePath, project.cover) : '';
  const galleryUrls = unique((project.gallery || []).map((path) => projectAssetUrl(project.storagePath, path))).filter((url) => url !== coverUrl);
  const cover = coverUrl ? await rasterize(coverUrl) : undefined;
  const gallery = (await Promise.all(galleryUrls.map((url) => rasterize(url)))).filter((value): value is string => Boolean(value));
  const technologyIcons = new Map<string, string>();
  for (const technology of project.technologies) {
    const item = technologyValue(technology);
    if (!item.icon) continue;
    const image = await rasterize(technologyIconUrl(item.icon, project.storagePath), true);
    if (image) technologyIcons.set(item.name, image);
  }
  return { cover, gallery, technologyIcons };
}

function careerContexts(projectId: string, career: Career | null): CareerContext[] {
  if (!career) return [];
  return career.projectAssignments.flatMap((assignment) => {
    if (assignment.projectId !== projectId) return [];
    const engagement = career.engagements.find((item) => item.id === assignment.engagementId);
    const organization = engagement ? career.organizations.find((item) => item.id === engagement.organizationId) : undefined;
    return engagement && organization ? [{ assignment, engagement, organization }] : [];
  });
}

function sectionTitle(title: string): Content {
  return { text: title, style: 'sectionTitle', margin: [0, 14, 0, 7] };
}

function listSection(title: string, items?: string[]): Content[] {
  const values = unique(items || []);
  return values.length ? [sectionTitle(title), { ul: values.map((text) => ({ text, margin: [0, 0, 0, 3] })), style: 'body' }] : [];
}

function technologyRows(project: Project, assets: ProjectAssets): Content {
  const cells = project.technologies.map((technology: string | ProjectTechnology) => {
    const item = technologyValue(technology);
    const icon = assets.technologyIcons.get(item.name);
    return {
      table: {
        widths: icon ? [18, '*'] : ['*'],
        body: [[...(icon ? [{ image: icon, width: 14, height: 14, margin: [0, 1, 0, 0] }] : []), { text: item.name, style: 'technology', margin: [0, 2, 0, 0] }]]
      },
      layout: { fillColor: () => '#f1f6fd', hLineColor: () => '#d9e5f3', vLineColor: () => '#d9e5f3', paddingLeft: () => 7, paddingRight: () => 7, paddingTop: () => 5, paddingBottom: () => 5 },
      margin: [0, 0, 6, 6]
    } as Content;
  });
  const rows: Content[] = [];
  for (let index = 0; index < cells.length; index += 3) rows.push({ columns: [cells[index], cells[index + 1] || { text: '' }, cells[index + 2] || { text: '' }], columnGap: 4 });
  return { stack: rows };
}

function careerBlock(context: CareerContext): Content {
  const details = [context.assignment.role, context.assignment.contribution].filter(Boolean) as string[];
  const participation = unique(context.assignment.participationTypes || []);
  return {
    table: {
      widths: [5, '*'],
      body: [[
        { text: '', fillColor: '#1768e8', border: [false, false, false, false] },
        {
          stack: [
            { text: context.organization.name, style: 'company' },
            { text: context.engagement.title, style: 'careerRole' },
            { text: careerPeriod(context.assignment, context.engagement), style: 'meta', margin: [0, 2, 0, 4] },
            ...(participation.length ? [{ text: `Формат участия: ${participation.join(', ')}`, style: 'meta', margin: [0, 0, 0, 3] }] : []),
            ...details.map((text) => ({ text, style: 'body', margin: [0, 2, 0, 0] })),
            ...(context.assignment.highlights?.length ? [{ ul: context.assignment.highlights, style: 'body', margin: [0, 4, 0, 0] }] : [])
          ],
          fillColor: '#f5f8fc',
          border: [false, false, false, false]
        }
      ]]
    },
    layout: { paddingLeft: () => 9, paddingRight: () => 10, paddingTop: () => 8, paddingBottom: () => 8 },
    margin: [0, 0, 0, 7],
    unbreakable: true
  };
}

function galleryBlock(images: string[]): Content[] {
  if (!images.length) return [];
  const columnsPerRow = images.length >= 3 ? 3 : 2;
  const imageFit: [number, number] = columnsPerRow === 3 ? [160, 115] : [246, 170];
  const rows: Content[] = [];
  for (let index = 0; index < images.length; index += columnsPerRow) {
    rows.push({
      columns: Array.from({ length: columnsPerRow }, (_, offset) => images[index + offset]
        ? { image: images[index + offset], fit: imageFit, alignment: 'center', margin: [0, 0, 0, 9] }
        : { text: '' }),
      columnGap: 6
    });
  }
  return [sectionTitle('Галерея'), ...rows];
}

export function buildProjectsPdfDefinition(source: Omit<ProjectPdfSource, 'onProgress'>, assets: Map<string, ProjectAssets>): TDocumentDefinitions {
  const sorted = [...source.projects].sort((first, second) => second.date.localeCompare(first.date));
  const years = sorted.map((project) => Number(project.date.slice(0, 4))).filter(Number.isFinite);
  const period = years.length ? `${Math.min(...years)}${Math.min(...years) === Math.max(...years) ? '' : `-${Math.max(...years)}`}` : '';
  const content: Content[] = [{
    stack: [
      { text: 'ПОРТФОЛИО', style: 'coverKicker' },
      { text: 'Избранные проекты', style: 'coverTitle', margin: [0, 18, 0, 13] },
      { text: source.profile?.name || 'Портфолио проектов', style: 'coverAuthor' },
      { text: `${projectsCountLabel(sorted.length)}${period ? `  •  ${period}` : ''}`, style: 'coverMeta', margin: [0, 24, 0, 0] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 4, lineColor: '#1768e8' }], margin: [0, 34, 0, 0] }
    ],
    margin: [0, 170, 0, 0],
    pageBreak: 'after'
  }, {
    toc: {
      id: 'projects',
      title: {
        stack: [
          { text: 'НАВИГАЦИЯ', style: 'coverKicker' },
          { text: 'Оглавление', style: 'tocTitle', margin: [0, 12, 0, 7] },
          { text: 'Нажмите на название, чтобы перейти к проекту.', style: 'tocHint', margin: [0, 0, 0, 24] }
        ]
      },
      textMargin: [0, 0, 0, 11],
      textStyle: 'tocEntry',
      numberStyle: 'tocNumber'
    },
    pageBreak: 'after'
  }];

  sorted.forEach((project, projectIndex) => {
    const projectAssets = assets.get(project.id) || { gallery: [], technologyIcons: new Map<string, string>() };
    const contexts = careerContexts(project.id, source.career);
    content.push(
      { text: `${String(projectIndex + 1).padStart(2, '0')} / ${String(sorted.length).padStart(2, '0')}  •  ${project.type.name.toLocaleUpperCase('ru-RU')}`, style: 'projectKicker', pageBreak: projectIndex ? 'before' : undefined },
      { text: project.title, id: `project-${project.id}`, style: 'projectTitle', margin: [0, 8, 0, 5], tocItem: 'projects', tocStyle: 'tocEntry', tocNumberStyle: 'tocNumber', tocMargin: [0, 0, 0, 11] },
      { text: project.shortDescription, style: 'lead', margin: [0, 0, 0, 13] }
    );
    if (projectAssets.cover) content.push({ image: projectAssets.cover, fit: [515, 280], alignment: 'center', margin: [0, 0, 0, 13] });
    content.push({
      table: { widths: ['*', '*', '*'], body: [[
        { stack: [{ text: 'ДАТА', style: 'metaLabel' }, { text: dateLabel(project.date), style: 'metaValue' }] },
        { stack: [{ text: 'ТИП', style: 'metaLabel' }, { text: project.type.name, style: 'metaValue' }] },
        { stack: [{ text: 'НАПРАВЛЕНИЕ', style: 'metaLabel' }, { text: project.direction.name, style: 'metaValue' }] }
      ]] },
      layout: { fillColor: () => '#f3f6fa', hLineColor: () => '#dfe7f0', vLineColor: () => '#dfe7f0', paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 8, paddingBottom: () => 8 },
      margin: [0, 0, 0, 8]
    });
    if (contexts.length) content.push(sectionTitle('Компания и должность'), ...contexts.map(careerBlock));
    if (project.description) content.push(sectionTitle('О проекте'), ...project.description.split(/\n\s*\n/).filter(Boolean).map((text) => ({ text, style: 'body', margin: [0, 0, 0, 6] } as Content)));
    if (project.role) content.push(sectionTitle('Моя роль'), { text: project.role, style: 'body' });
    if (project.technologies.length) content.push(sectionTitle('Ключевые технологии'), technologyRows(project, projectAssets));
    content.push(...listSection('Основные задачи', project.tasks), ...listSection('Функциональные возможности', project.features), ...listSection('Результаты', project.results));
    content.push(...galleryBlock(projectAssets.gallery));
    if (project.links?.length) content.push(sectionTitle('Ссылки'), ...project.links.map((link) => ({ text: link.title || link.url, link: link.url, color: '#1768e8', decoration: 'underline', margin: [0, 0, 0, 4] } as Content)));
    if (project.files?.length) content.push(sectionTitle('Файлы'), { ul: project.files.map((file) => `${file.name}${file.description ? ` - ${file.description}` : ''}`), style: 'body' });
  });

  return {
    info: { title: 'Портфолио избранных проектов', author: source.profile?.name || 'Портфолио' },
    pageSize: 'A4',
    pageMargins: [40, 38, 40, 44],
    content,
    defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#2c4055', lineHeight: 1.3 },
    styles: {
      coverKicker: { fontSize: 11, bold: true, color: '#1768e8', characterSpacing: 2.4 },
      coverTitle: { fontSize: 39, bold: true, color: '#0e263e', lineHeight: 1.04 },
      coverAuthor: { fontSize: 17, bold: true, color: '#46627e' },
      coverMeta: { fontSize: 11, color: '#75879a' },
      tocTitle: { fontSize: 31, bold: true, color: '#10263d', lineHeight: 1.05 },
      tocHint: { fontSize: 10.5, color: '#71859a' },
      tocEntry: { fontSize: 11.5, bold: true, color: '#24425f', lineHeight: 1.25 },
      tocNumber: { fontSize: 10.5, bold: true, color: '#1768e8' },
      projectKicker: { fontSize: 8.5, bold: true, color: '#1768e8', characterSpacing: 1.2 },
      projectTitle: { fontSize: 25, bold: true, color: '#10263d', lineHeight: 1.08 },
      lead: { fontSize: 11.5, color: '#566b80', lineHeight: 1.35 },
      sectionTitle: { fontSize: 13, bold: true, color: '#10263d' },
      body: { fontSize: 9.5, color: '#334a60' },
      metaLabel: { fontSize: 7, bold: true, color: '#8797a7', characterSpacing: .6 },
      metaValue: { fontSize: 9, bold: true, color: '#294158', margin: [0, 3, 0, 0] },
      company: { fontSize: 10.5, bold: true, color: '#1768e8' },
      careerRole: { fontSize: 10, bold: true, color: '#18334f', margin: [0, 2, 0, 0] },
      meta: { fontSize: 8, color: '#708297' },
      technology: { fontSize: 8.5, bold: true, color: '#29445f' }
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Портфолио проектов  •  ${new Intl.DateTimeFormat('ru-RU').format(new Date())}`, alignment: 'left' },
        { text: `${currentPage} / ${pageCount}`, alignment: 'right' }
      ],
      margin: [40, 12, 40, 0], fontSize: 7.5, color: '#8796a5'
    })
  };
}

export async function downloadProjectsPdf(source: ProjectPdfSource) {
  const assets = new Map<string, ProjectAssets>();
  for (const [index, project] of source.projects.entries()) {
    source.onProgress?.({ message: `Подготавливаем изображения: ${project.title}`, value: Math.round(8 + (index / source.projects.length) * 67) });
    assets.set(project.id, await loadAssets(project));
    source.onProgress?.({ message: `Обработано проектов: ${index + 1} из ${source.projects.length}`, value: Math.round(8 + ((index + 1) / source.projects.length) * 67) });
  }
  source.onProgress?.({ message: 'Собираем страницы PDF', value: 84 });
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]);
  const pdfMake = pdfMakeModule.default;
  const fontFiles = pdfFontsModule.default as unknown as { vfs?: Record<string, string> } & Record<string, string>;
  pdfMake.vfs = fontFiles.vfs ?? fontFiles;
  const fileName = `Портфолио_проектов_${new Date().toISOString().slice(0, 10)}.pdf`;
  source.onProgress?.({ message: 'Формируем файл для скачивания', value: 94 });
  await new Promise<void>((resolve) => pdfMake.createPdf(buildProjectsPdfDefinition(source, assets)).download(fileName, resolve));
  source.onProgress?.({ message: 'PDF готов и скачивается', value: 100 });
}
