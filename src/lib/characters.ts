import type { Volume } from '../types'

/** Character name (as written in volumi.json) → portrait from the character's English Wikipedia page. */
const PORTRAITS: Record<string, string> = {
  'Spider-Man': 'https://upload.wikimedia.org/wikipedia/en/2/21/Web_of_Spider-Man_Vol_1_129-1.png',
  'Spectacular Spider Man': 'https://upload.wikimedia.org/wikipedia/en/2/21/Web_of_Spider-Man_Vol_1_129-1.png',
  'Spider-Man (ultimate)': 'https://upload.wikimedia.org/wikipedia/en/2/2d/Spider-Man_%28Ultimate_Marvel_character%29.png',
  'Spider-Man (Miles Morales)': 'https://upload.wikimedia.org/wikipedia/en/8/8e/Spider-Man_%28Miles_Morales%29_character_art.png',
  'Superior Spider-Man': 'https://upload.wikimedia.org/wikipedia/en/b/ba/Superior_Spider-Man_1.jpg',
  'Spider-Men': 'https://upload.wikimedia.org/wikipedia/en/1/15/Spider-men2.jpg',
  'Spider Woman': 'https://upload.wikimedia.org/wikipedia/en/6/61/Spider-Woman_%28Jessica_Drew_-_original_costume_-_circa_2020%29.png',
  'Daredevil': 'https://upload.wikimedia.org/wikipedia/en/1/14/Daredevil_65.jpg',
  'Daredevil/Matt Murdock': 'https://upload.wikimedia.org/wikipedia/en/1/14/Daredevil_65.jpg',
  'Marvel Knights': 'https://upload.wikimedia.org/wikipedia/en/1/14/Daredevil_65.jpg',
  'Iron Man': 'https://upload.wikimedia.org/wikipedia/en/4/47/Iron_Man_%28circa_2018%29.png',
  'Iron Patriot (Norman Osborn)': 'https://upload.wikimedia.org/wikipedia/en/3/33/Norman_Osborn.jpg',
  'Hulk': 'https://upload.wikimedia.org/wikipedia/en/a/aa/Hulk_%28circa_2019%29.png',
  'Red Hulk': 'https://upload.wikimedia.org/wikipedia/en/d/d2/ThunderboltRoss.jpg',
  'She-Hulk': 'https://upload.wikimedia.org/wikipedia/en/1/14/She-Hulk_Various_incarnations.jpg',
  'Wolverine': 'https://upload.wikimedia.org/wikipedia/en/d/d3/Wolverine_%28circa_2024%29.jpg',
  'Logan (Old Man Logan)': 'https://upload.wikimedia.org/wikipedia/en/e/e0/Logan_%28Earth-807128%29.png',
  'Deadpool': 'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png',
  'Thor': 'https://upload.wikimedia.org/wikipedia/en/1/1a/Thor_%28Marvel_Comics%29.png',
  'Loki': 'https://upload.wikimedia.org/wikipedia/en/e/ee/Various_incarnations_of_Loki_%282014%29.webp',
  'Silver Surfer': 'https://upload.wikimedia.org/wikipedia/en/3/34/Silver_Surfer.png',
  'Punisher': 'https://upload.wikimedia.org/wikipedia/en/c/c8/Punisher_%28circa_2026%29.png',
  'Captain America (Steve Rogers)': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Captain_America.png',
  'Captain America (Sam Wilson)': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Captain_America.png',
  'Capitan America': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Captain_America.png',
  'Steve Rogers': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Captain_America.png',
  'Captain Marvel': 'https://upload.wikimedia.org/wikipedia/en/0/02/Carol_Danvers_-_%28evolution%29.jpg',
  'Avengers': 'https://upload.wikimedia.org/wikipedia/en/2/2b/Avengers_%28Marvel_Comics%29_vol_3_num_38.jpg',
  'West Coast Avengers': 'https://upload.wikimedia.org/wikipedia/en/5/5c/West_Coast_Avengers_vol._2%2C_no._1_%28cover_art%29.jpg',
  'Incredibili Avengers': 'https://upload.wikimedia.org/wikipedia/en/6/6d/Uncanny_Avengers.jpg',
  'Thunderbolts': 'https://upload.wikimedia.org/wikipedia/en/f/f0/Thunderbolts_%28Marvel_Comics_characters%29.png',
  'Vision': 'https://upload.wikimedia.org/wikipedia/en/3/3d/Vision_%28Marvel_Comics%29.png',
  'Wiccan': 'https://upload.wikimedia.org/wikipedia/en/b/b5/YA_Wiccan.png',
  'Sentry': 'https://upload.wikimedia.org/wikipedia/en/5/57/Sentry_%28Robert_Reynolds%29.png',
  'X-Men': 'https://upload.wikimedia.org/wikipedia/en/d/db/X-Men_%28Vol._6%29_No._2_Mahmud_Asrar_Variant_%28Textless%29.jpg',
  'New X-Men': 'https://upload.wikimedia.org/wikipedia/en/d/db/X-Men_%28Vol._6%29_No._2_Mahmud_Asrar_Variant_%28Textless%29.jpg',
  'X-Force': 'https://upload.wikimedia.org/wikipedia/en/4/41/X-Force_Vol_4_2.png',
  'Cyclops': 'https://upload.wikimedia.org/wikipedia/en/e/e9/Cyclops_%28Scott_Summers_circa_2019%29.png',
  'Ororo Munroe': 'https://upload.wikimedia.org/wikipedia/en/3/34/Storm_%28Ororo_Munroe%29.png',
  'Charles Xavier': 'https://upload.wikimedia.org/wikipedia/en/a/a8/Professor_X.png',
  'Emma Frost': 'https://upload.wikimedia.org/wikipedia/en/0/02/Emma_Frost_%28Modern%29.webp',
  'Magneto': 'https://upload.wikimedia.org/wikipedia/en/e/e9/Magneto_%28Marvel_Comics_character%29.jpg',
  'Danielle Moonstar': 'https://upload.wikimedia.org/wikipedia/en/9/95/Moonstar_fearless.jpg',
  'Thanos': 'https://upload.wikimedia.org/wikipedia/en/b/b7/Thanos_%28Infobox_image%29.png',
  'Doctor Strange': 'https://upload.wikimedia.org/wikipedia/en/4/4f/Doctor_Strange_Vol_4_2_Ross_Variant_Textless.jpg',
  'Fantastici Quattro': 'https://upload.wikimedia.org/wikipedia/en/1/1b/Fantastic_Four_%28Marvel_Comics_characters%29.jpg',
  'Mr Fantastic': 'https://upload.wikimedia.org/wikipedia/en/d/d3/Mister_Fantastic.png',
  'Mr. Fantastic (Reed Richards)': 'https://upload.wikimedia.org/wikipedia/en/d/d3/Mister_Fantastic.png',
  'Valeria Richards': 'https://upload.wikimedia.org/wikipedia/en/c/c5/Valeria_Richards_%28Fantastic_Four_character%29.png',
  'Venom (Flash Thompson)': 'https://upload.wikimedia.org/wikipedia/en/9/95/Flash_Thompson.png',
  'Eddie Brock': 'https://upload.wikimedia.org/wikipedia/en/f/fa/Venom_%28Eddie_Brock%29.png',
  'Jessica Jones': 'https://upload.wikimedia.org/wikipedia/en/6/6e/Jessica_Jones_by_Mike_Mayhew.jpg',
  'Inumani': 'https://upload.wikimedia.org/wikipedia/en/b/b0/Inhumans.jpg',
  'Original Sin': 'https://upload.wikimedia.org/wikipedia/en/a/aa/Original_sin_1.jpg',
  'Moon Knight': 'https://upload.wikimedia.org/wikipedia/en/4/4a/Moon_Knight_%28Marc_Spector%29.png',
  'Nova': 'https://upload.wikimedia.org/wikipedia/en/2/26/Nova1adigranov.jpg',
  'Nova (Sam Alexander)': 'https://upload.wikimedia.org/wikipedia/en/7/72/Nova_%28Sam_Alexander%29.jpg',
  'Kamala Khan': 'https://upload.wikimedia.org/wikipedia/en/d/db/Kamala_Khan.jpg',
  'Black Panther': 'https://upload.wikimedia.org/wikipedia/en/f/f7/Black_Panther_%28T%27Challa%29.png',
  'Guardiani della Galassia': 'https://upload.wikimedia.org/wikipedia/en/8/8f/GuardiansoftheGalaxy.jpg',
  'Star-Lord': 'https://upload.wikimedia.org/wikipedia/en/1/15/ST1.PNG',
  'Sub-Mariner': 'https://upload.wikimedia.org/wikipedia/en/f/f2/Namor_the_Sub-Mariner.png',
  'Ghost Rider (Blaze)': 'https://upload.wikimedia.org/wikipedia/en/1/1f/GhostRiderCVR001b.jpg',
  'Red Skull (Sinthea Shmidt)': 'https://upload.wikimedia.org/wikipedia/en/e/ef/Sin_%28Sinthea_Schmidt_circa_2006%29.png',
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const ENTRIES = Object.entries(PORTRAITS)
  .map(([name, url]) => ({ name, key: normalize(name), url }))
  // Longest names first, so "Superior Spider-Man" wins over "Spider-Man".
  .sort((a, b) => b.key.length - a.key.length)

const contains = (haystack: string, needle: string) => ` ${haystack} `.includes(` ${needle} `)

export interface Portrait {
  name: string
  url: string
}

/**
 * The main character's portrait: the volume's own URL if set, otherwise the first listed
 * character with a known portrait, otherwise a character named in the title.
 */
export function portraitOf(volume: Volume): Portrait | null {
  if (volume.personaggioUrl) return { name: volume.personaggi[0] ?? volume.titolo, url: volume.personaggioUrl }

  for (const p of volume.personaggi) {
    const key = normalize(p)
    const exact = ENTRIES.find((e) => e.key === key)
    if (exact) return { name: p, url: exact.url }
    const partial = ENTRIES.find((e) => contains(key, e.key))
    if (partial) return { name: p, url: partial.url }
  }

  const title = normalize(volume.titolo)
  const inTitle = ENTRIES.find((e) => contains(title, e.key))
  return inTitle ? { name: inTitle.name, url: inTitle.url } : null
}
