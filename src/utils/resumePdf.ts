import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Career, CareerEngagement } from '../types/career';
import type { Education } from '../types/education';
import type { Profile, TechnologyGroup, TechnologyItem } from '../types/profile';

interface ResumeSource {
  profile: Profile;
  career: Career;
  education: Education | null;
}

const employmentNames: Record<string, string> = {
  'full-time': 'Полная занятость',
  'part-time': 'Частичная занятость',
  contract: 'Контракт',
  freelance: 'Фриланс',
  'self-employed': 'Собственный проект',
  internship: 'Стажировка',
  volunteer: 'Волонтёрство',
  'project-based': 'Проектная работа',
  other: 'Другое'
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`));
}

function periodLabel(item: CareerEngagement) {
  return `${dateLabel(item.startDate)} — ${item.endDate ? dateLabel(item.endDate) : 'настоящее время'}`;
}

function textBlocks(...values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values.flatMap((value) => (value || '').split(/\n\s*\n/))
    .map((value) => value.trim())
    .filter((value) => value && !seen.has(value.toLocaleLowerCase('ru-RU')) && seen.add(value.toLocaleLowerCase('ru-RU')));
}

function technologyNames(items: Profile['technologies']) {
  if (!items.length) return [];
  if (typeof items[0] === 'string') {
    return (items as string[]).flatMap((value) => value.trim().endsWith(':') ? [] : value.split(','));
  }
  return (items as TechnologyGroup[]).flatMap((group) => group.items.map((item) => typeof item === 'string' ? item : (item as TechnologyItem).name));
}

function unique(values: Array<string | undefined>) {
  const result = new Map<string, string>();
  values.forEach((value) => {
    const clean = value?.trim();
    if (clean) result.set(clean.toLocaleLowerCase('ru-RU'), clean);
  });
  return [...result.values()];
}

function sectionTitle(text: string): Content {
  return {
    table: { widths: ['*'], body: [[{ text, style: 'sectionTitle', border: [false, false, false, true] }]] },
    layout: { hLineColor: () => '#b8cbe0', hLineWidth: () => 1, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 6 },
    margin: [0, 15, 0, 9]
  };
}

function bulletBlock(title: string, items?: string[]): Content[] {
  const values = unique(items || []);
  if (!values.length) return [];
  return [
    { text: title, style: 'listTitle', margin: [0, 7, 0, 3] },
    { ul: values.map((text) => ({ text, margin: [0, 0, 0, 2] })), style: 'body' }
  ];
}

function contactLines(profile: Profile): Content[] {
  const contacts: Content[] = [];
  if (profile.contacts.email) contacts.push({ text: profile.contacts.email, link: `mailto:${profile.contacts.email}`, style: 'contact' });
  if (profile.contacts.telegram) {
    const value = profile.contacts.telegram;
    contacts.push({ text: value, link: value.startsWith('http') ? value : `https://t.me/${value.replace('@', '')}`, style: 'contact' });
  }
  if (profile.contacts.github) contacts.push({ text: profile.contacts.github.replace(/^https?:\/\//, ''), link: profile.contacts.github, style: 'contact' });
  return contacts;
}

export function buildResumeDefinition({ profile, career, education }: ResumeSource): TDocumentDefinitions {
  const organizations = new Map(career.organizations.map((item) => [item.id, item]));
  const engagements = [...career.engagements].sort((a, b) => b.startDate.localeCompare(a.startDate) || (b.order ?? 0) - (a.order ?? 0));
  const technologies = unique([
    ...technologyNames(profile.technologies),
    ...engagements.flatMap((item) => [...(item.technologies || []), ...(item.skills || [])])
  ]);
  const competencies = unique(profile.specializations.map((item) => item.title));
  const content: Content[] = [
    {
      columns: [
        { width: '*', stack: [{ text: profile.name, style: 'name' }, { text: profile.position, style: 'position' }] },
        { width: 185, stack: contactLines(profile), alignment: 'right' }
      ],
      columnGap: 20,
      margin: [0, 0, 0, 12]
    },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#1768e8' }], margin: [0, 0, 0, 10] },
    sectionTitle('Обо мне'),
    ...textBlocks(profile.description, profile.about, career.summary).map((text) => ({ text, style: 'body', margin: [0, 0, 0, 7] } as Content))
  ];

  if (competencies.length) content.push(
    { text: 'Ключевые компетенции', style: 'listTitle', margin: [0, 6, 0, 4] },
    { text: competencies.join('  •  '), style: 'skills' }
  );
  content.push(...bulletBlock('Ключевой опыт', profile.experience));
  if (technologies.length) content.push(
    { text: 'Технологии и инструменты', style: 'listTitle', margin: [0, 8, 0, 4] },
    { text: technologies.join('  •  '), style: 'skills' }
  );

  content.push(sectionTitle('Опыт работы'));
  engagements.forEach((item) => {
    const organization = organizations.get(item.organizationId);
    const meta = unique([
      periodLabel(item),
      employmentNames[item.employmentType] || item.employmentType,
      item.workMode,
      item.location || organization?.location
    ]).join('  •  ');
    content.push(
      {
        columns: [
          { width: '*', stack: [{ text: item.title, style: 'role' }, { text: organization?.name || item.organizationId, style: 'company' }] },
          { width: 205, text: periodLabel(item), style: 'period', alignment: 'right' }
        ],
        columnGap: 16,
        margin: [0, 8, 0, 2]
      },
      { text: meta, style: 'meta', margin: [0, 0, 0, 5] }
    );
    if (item.transitionFrom) content.push({ text: `Переход: ${item.transitionFrom.title}${item.transitionFrom.description ? ` — ${item.transitionFrom.description}` : ''}`, style: 'transition', margin: [0, 2, 0, 5] });
    if (item.summary) content.push({ text: item.summary, style: 'body', margin: [0, 0, 0, 4] });
    content.push(...bulletBlock('Результаты', item.achievements));
    content.push(...bulletBlock('Обязанности и задачи', [...(item.responsibilities || []), ...(item.activities || [])]));
    if (item.keyFacts?.length) content.push({ text: [{ text: 'Ключевые факты: ', bold: true }, item.keyFacts.map((fact) => `${fact.label}: ${fact.value}`).join('  •  ')], style: 'meta', margin: [0, 5, 0, 3] });
    const roleSkills = unique([...(item.technologies || []), ...(item.skills || [])]);
    if (roleSkills.length) content.push({ text: [{ text: 'Навыки: ', bold: true }, roleSkills.join(', ')], style: 'meta', margin: [0, 5, 0, 7] });
  });

  if (education?.education.length) {
    content.push(sectionTitle('Образование'));
    [...education.education].sort((a, b) => b.graduationYear - a.graduationYear || (a.order ?? 0) - (b.order ?? 0)).forEach((item) => {
      content.push({
        columns: [
          { width: '*', stack: [{ text: item.institution, style: 'role' }, { text: `${item.level} • ${item.faculty}`, style: 'meta' }, { text: item.specialization, style: 'company' }] },
          { width: 70, text: String(item.graduationYear), style: 'period', alignment: 'right' }
        ],
        columnGap: 15,
        margin: [0, 6, 0, 7]
      });
      if (item.description) content.push({ text: item.description, style: 'body', margin: [0, -3, 0, 7] });
    });
  }

  if (education?.courses.length) {
    content.push(sectionTitle('Курсы и повышение квалификации'));
    [...education.courses].sort((a, b) => b.completionYear - a.completionYear || (a.order ?? 0) - (b.order ?? 0)).forEach((item) => {
      content.push({
        columns: [
          { width: '*', stack: [{ text: item.title, style: 'role' }, { text: item.organization, style: 'company' }, { text: item.specialization, style: 'meta' }] },
          { width: 70, text: String(item.completionYear), style: 'period', alignment: 'right' }
        ],
        columnGap: 15,
        margin: [0, 6, 0, 5]
      });
      if (item.description) content.push({ text: item.description, style: 'body', margin: [0, 0, 0, 7] });
    });
  }

  return {
    info: { title: `Резюме — ${profile.name}`, author: profile.name, subject: profile.position },
    pageSize: 'A4',
    pageMargins: [40, 38, 40, 42],
    content,
    defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#24364b', lineHeight: 1.25 },
    styles: {
      name: { fontSize: 25, bold: true, color: '#10263d', lineHeight: 1.05 },
      position: { fontSize: 12.5, bold: true, color: '#1768e8', margin: [0, 5, 0, 0] },
      contact: { fontSize: 8.5, color: '#416486', margin: [0, 1, 0, 1] },
      sectionTitle: { fontSize: 14, bold: true, color: '#10263d' },
      role: { fontSize: 11.5, bold: true, color: '#10263d' },
      company: { fontSize: 9.5, bold: true, color: '#1768e8', margin: [0, 2, 0, 0] },
      period: { fontSize: 8.5, bold: true, color: '#3f5e7a' },
      meta: { fontSize: 8.5, color: '#65788c' },
      body: { fontSize: 9.5, color: '#33475c' },
      listTitle: { fontSize: 9, bold: true, color: '#183b61' },
      skills: { fontSize: 8.7, color: '#405e7b' },
      transition: { fontSize: 8.5, bold: true, color: '#315f96', background: '#edf5ff' }
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Резюме сформировано из данных портфолио • ${new Intl.DateTimeFormat('ru-RU').format(new Date())}`, alignment: 'left' },
        { text: `${currentPage} / ${pageCount}`, alignment: 'right' }
      ],
      margin: [40, 12, 40, 0], fontSize: 7.5, color: '#8796a5'
    })
  };
}

export async function downloadResumePdf(source: ResumeSource) {
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts')
  ]);
  const pdfMake = pdfMakeModule.default;
  const fontFiles = pdfFontsModule.default as unknown as { vfs?: Record<string, string> } & Record<string, string>;
  pdfMake.vfs = fontFiles.vfs ?? fontFiles;
  const fileName = `Резюме_${source.profile.name.trim().replace(/\s+/g, '_')}.pdf`;
  const pdf = pdfMake.createPdf(buildResumeDefinition(source));
  await new Promise<void>((resolve) => pdf.download(fileName, resolve));
}
