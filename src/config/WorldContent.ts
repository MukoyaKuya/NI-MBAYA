import { StoryLanguage } from './GameSettings';

export type LocalizedCopy = { en: string; sw: string };

export function copyFor(language: StoryLanguage, copy: LocalizedCopy) {
  return copy[language];
}

export const LEVEL_CONTEXT: Record<number, LocalizedCopy> = {
  1: {
    en: 'Nairobi CBD is the opening arena: a fast-moving city centre where the fight begins.',
    sw: 'Nairobi CBD ndiyo uwanja wa kwanza: katikati ya jiji lenye kasi, pambano linaanza.',
  },
  2: {
    en: 'The backstreet level narrows the space and raises the pressure as rivals close in.',
    sw: 'Uwanja wa mtaa wa nyuma unabana nafasi na kuongeza presha wapinzani wanapokaribia.',
  },
  3: {
    en: 'Above the city, the rooftops turn movement, timing, and distance into the challenge.',
    sw: 'Juu ya jiji, paa za majengo zinageuza mwendo, muda na umbali kuwa changamoto.',
  },
  4: {
    en: 'Kibera is presented here as a fictional fight arena inspired by Nairobi’s energy—not a statement about its residents.',
    sw: 'Kibera inaonyeshwa hapa kama uwanja wa kubuni uliohamasishwa na nguvu ya Nairobi—si maelezo ya wakazi wake.',
  },
};

export const FIGHTER_BIOS: Record<string, LocalizedCopy> = {
  majembe: {
    en: 'Majembe is a street fighter who trusts rhythm, reach, and courage when the crowd closes in.',
    sw: 'Majembe ni mpiganaji wa mtaani anayeamini midundo, umbali na ujasiri wakati umati unakaribia.',
  },
  mjaka: {
    en: 'Mjaka Fine fights with pace and precision—quick entries, clean exits, and no wasted movement.',
    sw: 'Mjaka Fine hupigana kwa kasi na usahihi—anaingia haraka, anatoka safi, na hapotezi mwendo.',
  },
  mbavu: {
    en: 'Mbavu is a future challenger. Defeat him to unlock his chapter in the fight.',
    sw: 'Mbavu ni mpinzani wa baadaye. Mshinde ili kufungua sura yake kwenye pambano.',
  },
};