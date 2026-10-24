import { describe, it, expect } from 'vitest';
import { keywordMatch } from '@/lib/ai/keyword';

const tpl = (id: string, title: string, category: string, tags: string[], description = '') => ({ id, title, category, description, tags });
const catalogue = [
  tpl('late', 'Coming Late for Work', 'Discipline', ['late', 'lateness', 'punctuality', 'lewat'], 'Memo listing the dates an employee arrived late.'),
  tpl('absent', 'Show Cause Letter (Absent Without Permission)', 'Discipline', ['show cause', 'absent', 'absenteeism', 'tidak hadir']),
  tpl('nda', 'Non-Disclosure Agreement', 'Confidentiality', ['nda', 'confidentiality', 'perjanjian kerahsiaan']),
  tpl('pt', 'Part-time Employment Agreement', 'Employment Contracts', ['part-time', 'hourly', 'pekerja sambilan']),
  tpl('offer', 'Letter of Appointment', 'Employment Contracts', ['appointment', 'offer letter', 'new hire']),
];
const ids = (q: string) => keywordMatch(q, catalogue).map((t) => t.id);

describe('keywordMatch', () => {
  it('ranks the template whose words match the question first', () => {
    expect(ids('Staff keeps coming late, already gave verbal warning twice.')[0]).toBe('late');
    expect(ids('Staff absent 3 days in a row without telling anyone.')[0]).toBe('absent');
  });
  it('matches word variants and multi-word tags', () => {
    expect(ids('lateness problem')[0]).toBe('late');
    expect(ids('I want to hire a part-timer, what contract do I need?')[0]).toBe('pt');
    expect(ids('need an offer letter')[0]).toBe('offer');
  });
  it('matches Malay tags', () => {
    expect(ids('Pekerja selalu lewat')[0]).toBe('late');
    expect(ids('perlukan perjanjian kerahsiaan')[0]).toBe('nda');
  });
  it('ignores generic words so they do not pull in everything', () => {
    expect(ids('my employee and the company')).toEqual([]);
  });
  it('returns at most the limit, and nothing for an empty question', () => {
    expect(keywordMatch('late absent nda part-time appointment', catalogue, 3)).toHaveLength(3);
    expect(ids('   ')).toEqual([]);
  });
});
