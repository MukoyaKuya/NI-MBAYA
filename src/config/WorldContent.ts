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

export const LOCATION_STORIES: Record<number, { title: LocalizedCopy; body: LocalizedCopy }> = {
  1: { title: { en: 'NAIROBI CBD: THE CITY MOVES', sw: 'NAIROBI CBD: JIJI LINAENDA' }, body: { en: 'The CBD is a place of motion: commuters, traders, matatus and ambition crossing paths. In NI MBAYA, it becomes the first place Mbavu proves he can hold his ground.', sw: 'CBD ni mahali pa mwendo: wasafiri, wafanyabiashara, matatu na ndoto hukutana. Katika NI MBAYA, hapa ndipo Mbavu anaanza kuthibitisha anaweza kusimama imara.' } },
  2: { title: { en: 'BACKSTREETS: RHYTHM AND RESOLVE', sw: 'MITAA YA NDANI: MIDUNDO NA UJASIRI' }, body: { en: 'Every city has side streets where small businesses, late-night food and neighbours create their own rhythm. This chapter celebrates that everyday resilience.', sw: 'Kila jiji lina mitaa ya ndani ambako biashara ndogo, chakula cha usiku na majirani huunda midundo yao. Sura hii inaadhimisha ujasiri huo wa kila siku.' } },
  3: { title: { en: 'ROOFTOPS: A WIDER VIEW', sw: 'PAA ZA MAJENGO: MTIZAMO MPANA' }, body: { en: 'From above, Nairobi looks like many stories happening at once. The rooftops remind the fighter to look beyond the next opponent and keep moving with purpose.', sw: 'Kutoka juu, Nairobi inaonekana kama simulizi nyingi zinazotokea kwa wakati mmoja. Paa za majengo zinamkumbusha mpiganaji kutazama zaidi ya mpinzani anayefuata na kusonga kwa kusudi.' } },
  4: { title: { en: 'KIBERA: COMMUNITY AND CREATIVITY', sw: 'KIBERA: JAMII NA UBUNIFU' }, body: { en: 'This fictional chapter is inspired by Nairobi energy, not a claim to represent its residents. It honours the idea that creativity and community can be powerful sources of strength.', sw: 'Sura hii ya kubuni imehamasishwa na nguvu ya Nairobi, si madai ya kuwawakilisha wakazi wake. Inaenzi wazo kwamba ubunifu na jamii vinaweza kuwa vyanzo vya nguvu.' } },
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
