#!/usr/bin/env python3
"""
Build comprehensive sound catalog for Kre8/Strudel.

This script generates a JSON catalog of all available sounds with:
- Sound name
- Description (for semantic search)
- Category/source
- Tags
- Usage examples

The catalog is used by arrwDB for semantic search.

Total sounds: ~700+ (GM soundfonts + dirt-samples + drum machines + VCSL + synths)

Sound sources:
- GM Soundfonts: ~115 instruments (from @strudel/soundfonts)
- Dirt-Samples: ~217 sample banks (from tidalcycles/Dirt-Samples)
- Drum Machines: 72 machines with standard kit sounds (from tidal-drum-machines)
- VCSL: ~80 instruments (Versilian Community Sample Library)
- Built-in Synths: 6 oscillators
"""

import json
from pathlib import Path
from typing import TypedDict


class SoundEntry(TypedDict):
    id: str
    name: str
    description: str
    source: str
    category: str
    tags: list[str]
    example: str


def build_catalog() -> list[SoundEntry]:
    """Build the complete sound catalog."""
    sounds: list[SoundEntry] = []

    # ===========================================
    # GM SOUNDFONTS (General MIDI - 125 instruments)
    # High-quality sampled acoustic instruments
    # ===========================================

    gm_soundfonts = {
        # Keyboards
        "gm_acoustic_grand_piano": {
            "description": "Grand piano, realistic sampled acoustic piano. Best for classical, jazz, ballads. Warm, full-bodied tone with natural resonance.",
            "category": "keyboards",
            "tags": ["piano", "acoustic", "classical", "jazz", "ballad", "warm", "orchestral"],
            "example": 'note("c4 e4 g4").s("gm_acoustic_grand_piano")'
        },
        "gm_bright_acoustic_piano": {
            "description": "Bright acoustic piano with more presence in high frequencies. Cuts through mixes well. Good for pop and contemporary.",
            "category": "keyboards",
            "tags": ["piano", "acoustic", "bright", "pop", "contemporary"],
            "example": 'note("c4 e4 g4").s("gm_bright_acoustic_piano")'
        },
        "gm_electric_grand_piano": {
            "description": "Electric grand piano, hybrid between acoustic and electric. Vintage 70s sound.",
            "category": "keyboards",
            "tags": ["piano", "electric", "vintage", "70s"],
            "example": 'note("c4 e4 g4").s("gm_electric_grand_piano")'
        },
        "gm_honky_tonk_piano": {
            "description": "Detuned saloon piano with ragtime character. Slightly out of tune for authentic honky-tonk feel.",
            "category": "keyboards",
            "tags": ["piano", "honky-tonk", "ragtime", "detuned", "vintage", "saloon"],
            "example": 'note("c4 e4 g4").s("gm_honky_tonk_piano")'
        },
        "gm_epiano1": {
            "description": "Electric piano 1, Rhodes-like warm electric piano. Classic soul, R&B, jazz fusion sound. Smooth and bell-like.",
            "category": "keyboards",
            "tags": ["piano", "electric", "rhodes", "soul", "r&b", "jazz", "warm", "bell-like"],
            "example": 'note("c4 e4 g4").s("gm_epiano1")'
        },
        "gm_epiano2": {
            "description": "Electric piano 2, brighter electric piano variant. More bite than epiano1. FM-style tines.",
            "category": "keyboards",
            "tags": ["piano", "electric", "bright", "fm", "tines"],
            "example": 'note("c4 e4 g4").s("gm_epiano2")'
        },
        "gm_harpsichord": {
            "description": "Baroque harpsichord with plucked string character. Essential for baroque and renaissance music.",
            "category": "keyboards",
            "tags": ["harpsichord", "baroque", "renaissance", "plucked", "classical", "historical"],
            "example": 'note("c4 e4 g4").s("gm_harpsichord")'
        },
        "gm_clavinet": {
            "description": "Funky clavinet, percussive keyboard. Classic funk and soul sound. Wah-wah compatible.",
            "category": "keyboards",
            "tags": ["clavinet", "funk", "soul", "percussive", "wah"],
            "example": 'note("c4 e4 g4").s("gm_clavinet")'
        },
        "gm_celesta": {
            "description": "Celesta, magical bell-like keyboard. Sparkling, ethereal quality. Think Nutcracker Suite.",
            "category": "keyboards",
            "tags": ["celesta", "bells", "magical", "ethereal", "orchestral", "christmas"],
            "example": 'note("c5 e5 g5").s("gm_celesta")'
        },
        "gm_music_box": {
            "description": "Music box, delicate mechanical bell sound. Nostalgic, toy-like, innocent quality.",
            "category": "keyboards",
            "tags": ["music-box", "bells", "toy", "nostalgic", "innocent", "delicate"],
            "example": 'note("c5 e5 g5").s("gm_music_box")'
        },

        # Chromatic Percussion
        "gm_vibraphone": {
            "description": "Vibraphone, mellow mallet percussion with motor vibrato. Jazz standard, smooth and warm.",
            "category": "chromatic_percussion",
            "tags": ["vibraphone", "vibes", "jazz", "mellow", "mallet", "smooth"],
            "example": 'note("c4 e4 g4").s("gm_vibraphone")'
        },
        "gm_marimba": {
            "description": "Marimba, warm wooden mallet percussion. African and Latin influences. Rich low end.",
            "category": "chromatic_percussion",
            "tags": ["marimba", "mallet", "wooden", "african", "latin", "warm"],
            "example": 'note("c4 e4 g4").s("gm_marimba")'
        },
        "gm_xylophone": {
            "description": "Xylophone, bright wooden mallet percussion. Crisp attack, short decay. Cartoon-like.",
            "category": "chromatic_percussion",
            "tags": ["xylophone", "mallet", "wooden", "bright", "crisp", "cartoon"],
            "example": 'note("c5 e5 g5").s("gm_xylophone")'
        },
        "gm_glockenspiel": {
            "description": "Glockenspiel, bright metallic bells. High-pitched, sparkling, orchestral.",
            "category": "chromatic_percussion",
            "tags": ["glockenspiel", "bells", "metallic", "bright", "sparkling", "orchestral"],
            "example": 'note("c6 e6 g6").s("gm_glockenspiel")'
        },
        "gm_tubular_bells": {
            "description": "Tubular bells, orchestral chimes. Majestic, ceremonial, church-like.",
            "category": "chromatic_percussion",
            "tags": ["tubular-bells", "chimes", "orchestral", "majestic", "church", "ceremonial"],
            "example": 'note("c4 e4 g4").s("gm_tubular_bells")'
        },

        # Organs
        "gm_church_organ": {
            "description": "Pipe organ, majestic church organ with full stops. Sacred, powerful, reverberant.",
            "category": "organ",
            "tags": ["organ", "pipe", "church", "sacred", "majestic", "classical"],
            "example": 'note("c3 e3 g3").s("gm_church_organ")'
        },
        "gm_reed_organ": {
            "description": "Reed organ, harmonium-style pump organ. Vintage, folk, Americana.",
            "category": "organ",
            "tags": ["organ", "reed", "harmonium", "vintage", "folk", "americana"],
            "example": 'note("c4 e4 g4").s("gm_reed_organ")'
        },
        "gm_accordion": {
            "description": "Accordion, bellows-driven free-reed instrument. French, tango, folk music.",
            "category": "organ",
            "tags": ["accordion", "bellows", "french", "tango", "folk", "musette"],
            "example": 'note("c4 e4 g4").s("gm_accordion")'
        },
        "gm_harmonica": {
            "description": "Harmonica, blues harp. Expressive, bending notes, folk and blues essential.",
            "category": "organ",
            "tags": ["harmonica", "blues", "harp", "folk", "expressive"],
            "example": 'note("c4 e4 g4").s("gm_harmonica")'
        },

        # Guitars
        "gm_acoustic_guitar_nylon": {
            "description": "Classical nylon-string guitar. Soft, warm, fingerpicking. Spanish, classical, bossa nova.",
            "category": "guitar",
            "tags": ["guitar", "acoustic", "nylon", "classical", "spanish", "bossa-nova", "fingerpicking"],
            "example": 'note("c4 e4 g4").s("gm_acoustic_guitar_nylon")'
        },
        "gm_acoustic_guitar_steel": {
            "description": "Steel-string acoustic guitar. Bright, strumming, folk and country. Singer-songwriter staple.",
            "category": "guitar",
            "tags": ["guitar", "acoustic", "steel", "folk", "country", "strumming", "bright"],
            "example": 'note("c4 e4 g4").s("gm_acoustic_guitar_steel")'
        },
        "gm_electric_guitar_clean": {
            "description": "Clean electric guitar. Clear, bell-like, versatile. Funk, jazz, pop rhythm.",
            "category": "guitar",
            "tags": ["guitar", "electric", "clean", "funk", "jazz", "pop", "rhythm"],
            "example": 'note("c4 e4 g4").s("gm_electric_guitar_clean")'
        },
        "gm_electric_guitar_jazz": {
            "description": "Jazz electric guitar. Warm, hollow-body tone. Smooth jazz, bebop.",
            "category": "guitar",
            "tags": ["guitar", "electric", "jazz", "warm", "hollow-body", "bebop"],
            "example": 'note("c4 e4 g4").s("gm_electric_guitar_jazz")'
        },
        "gm_electric_guitar_muted": {
            "description": "Muted electric guitar. Palm-muted, chunky, rhythmic. Funk and rock rhythm.",
            "category": "guitar",
            "tags": ["guitar", "electric", "muted", "palm-mute", "funk", "rock", "rhythmic"],
            "example": 'note("c4 e4 g4").s("gm_electric_guitar_muted")'
        },
        "gm_overdriven_guitar": {
            "description": "Overdriven electric guitar. Crunchy, warm distortion. Classic rock, blues rock.",
            "category": "guitar",
            "tags": ["guitar", "electric", "overdrive", "crunch", "rock", "blues"],
            "example": 'note("c4 e4 g4").s("gm_overdriven_guitar")'
        },
        "gm_distortion_guitar": {
            "description": "Distorted electric guitar. Heavy, aggressive, saturated. Hard rock, metal.",
            "category": "guitar",
            "tags": ["guitar", "electric", "distortion", "heavy", "metal", "rock", "aggressive"],
            "example": 'note("c4 e4 g4").s("gm_distortion_guitar")'
        },
        "gm_guitar_harmonics": {
            "description": "Guitar harmonics. Bell-like overtones, ethereal. Ambient textures.",
            "category": "guitar",
            "tags": ["guitar", "harmonics", "bell-like", "ethereal", "ambient", "overtones"],
            "example": 'note("c5 e5 g5").s("gm_guitar_harmonics")'
        },

        # Bass
        "gm_acoustic_bass": {
            "description": "Upright acoustic bass, double bass. Jazz, orchestral, warm woody tone.",
            "category": "bass",
            "tags": ["bass", "acoustic", "upright", "double-bass", "jazz", "orchestral", "woody"],
            "example": 'note("c2 e2 g2").s("gm_acoustic_bass")'
        },
        "gm_electric_bass_finger": {
            "description": "Electric bass, fingerstyle. Round, warm, versatile. Most common bass sound.",
            "category": "bass",
            "tags": ["bass", "electric", "finger", "warm", "round", "versatile"],
            "example": 'note("c2 e2 g2").s("gm_electric_bass_finger")'
        },
        "gm_electric_bass_pick": {
            "description": "Electric bass, picked. Punchy, bright attack. Rock, punk.",
            "category": "bass",
            "tags": ["bass", "electric", "pick", "punchy", "bright", "rock", "punk"],
            "example": 'note("c2 e2 g2").s("gm_electric_bass_pick")'
        },
        "gm_slap_bass_1": {
            "description": "Slap bass. Funky, percussive, thumb-slap technique. Funk, disco.",
            "category": "bass",
            "tags": ["bass", "slap", "funk", "percussive", "disco", "thumb"],
            "example": 'note("c2 e2 g2").s("gm_slap_bass_1")'
        },
        "gm_slap_bass_2": {
            "description": "Slap bass variant. Different slap bass character, more aggressive.",
            "category": "bass",
            "tags": ["bass", "slap", "funk", "aggressive"],
            "example": 'note("c2 e2 g2").s("gm_slap_bass_2")'
        },
        "gm_synth_bass_1": {
            "description": "Synth bass 1. Electronic, punchy, subby. EDM, electronic, pop.",
            "category": "bass",
            "tags": ["bass", "synth", "electronic", "sub", "edm", "punchy"],
            "example": 'note("c2 e2 g2").s("gm_synth_bass_1")'
        },
        "gm_synth_bass_2": {
            "description": "Synth bass 2. Resonant, squelchy synth bass. Acid, electronic.",
            "category": "bass",
            "tags": ["bass", "synth", "resonant", "squelchy", "acid", "electronic"],
            "example": 'note("c2 e2 g2").s("gm_synth_bass_2")'
        },

        # Strings
        "gm_violin": {
            "description": "Solo violin. Expressive, emotional, classical. Lead melodic instrument.",
            "category": "strings",
            "tags": ["violin", "strings", "orchestral", "classical", "solo", "expressive", "emotional"],
            "example": 'note("c5 e5 g5").s("gm_violin")'
        },
        "gm_viola": {
            "description": "Solo viola. Warmer than violin, alto range. Rich, melancholic.",
            "category": "strings",
            "tags": ["viola", "strings", "orchestral", "classical", "warm", "alto", "melancholic"],
            "example": 'note("c4 e4 g4").s("gm_viola")'
        },
        "gm_cello": {
            "description": "Solo cello. Deep, rich, emotional. Tenor/bass range strings. Cinematic.",
            "category": "strings",
            "tags": ["cello", "strings", "orchestral", "classical", "deep", "rich", "cinematic", "emotional"],
            "example": 'note("c3 e3 g3").s("gm_cello")'
        },
        "gm_contrabass": {
            "description": "Double bass, contrabass. Deepest orchestral string. Foundation, gravitas.",
            "category": "strings",
            "tags": ["contrabass", "double-bass", "strings", "orchestral", "deep", "foundation"],
            "example": 'note("c2 e2 g2").s("gm_contrabass")'
        },
        "gm_tremolo_strings": {
            "description": "Tremolo strings. Rapid bowing, tension, suspense. Film scores.",
            "category": "strings",
            "tags": ["strings", "tremolo", "tension", "suspense", "film", "orchestral"],
            "example": 'note("c4 e4 g4").s("gm_tremolo_strings")'
        },
        "gm_pizzicato_strings": {
            "description": "Pizzicato strings. Plucked, playful, staccato. Light, whimsical.",
            "category": "strings",
            "tags": ["strings", "pizzicato", "plucked", "playful", "staccato", "whimsical"],
            "example": 'note("c4 e4 g4").s("gm_pizzicato_strings")'
        },
        "gm_orchestral_harp": {
            "description": "Concert harp. Ethereal, sweeping, glissando. Angelic, classical, film.",
            "category": "strings",
            "tags": ["harp", "orchestral", "ethereal", "glissando", "angelic", "classical"],
            "example": 'note("c4 e4 g4").s("gm_orchestral_harp")'
        },
        "gm_string_ensemble_1": {
            "description": "String ensemble, full section. Lush, cinematic, emotional pads. Film scores.",
            "category": "strings",
            "tags": ["strings", "ensemble", "orchestral", "lush", "cinematic", "pads", "film"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_string_ensemble_1")'
        },
        "gm_string_ensemble_2": {
            "description": "String ensemble 2. Slower attack, more atmospheric. Ambient, cinematic.",
            "category": "strings",
            "tags": ["strings", "ensemble", "atmospheric", "ambient", "slow-attack"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_string_ensemble_2")'
        },
        "gm_synth_strings_1": {
            "description": "Synth strings 1. Electronic string pad. 80s, synthwave, warm.",
            "category": "strings",
            "tags": ["strings", "synth", "pad", "80s", "synthwave", "electronic", "warm"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_synth_strings_1")'
        },
        "gm_synth_strings_2": {
            "description": "Synth strings 2. Brighter synth strings. More presence.",
            "category": "strings",
            "tags": ["strings", "synth", "bright", "electronic"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_synth_strings_2")'
        },

        # Brass
        "gm_trumpet": {
            "description": "Trumpet. Bright, powerful, cutting. Jazz, classical, fanfares, mariachi.",
            "category": "brass",
            "tags": ["trumpet", "brass", "bright", "powerful", "jazz", "fanfare", "classical"],
            "example": 'note("c5 e5 g5").s("gm_trumpet")'
        },
        "gm_trombone": {
            "description": "Trombone. Warm, powerful, slide. Jazz, classical, big band.",
            "category": "brass",
            "tags": ["trombone", "brass", "warm", "slide", "jazz", "big-band", "classical"],
            "example": 'note("c3 e3 g3").s("gm_trombone")'
        },
        "gm_tuba": {
            "description": "Tuba. Deep, powerful bass brass. Oom-pah, orchestral foundation.",
            "category": "brass",
            "tags": ["tuba", "brass", "deep", "bass", "orchestral", "oom-pah"],
            "example": 'note("c2 e2 g2").s("gm_tuba")'
        },
        "gm_muted_trumpet": {
            "description": "Muted trumpet. Nasal, intimate, jazz. Harmon mute, smoky clubs.",
            "category": "brass",
            "tags": ["trumpet", "muted", "brass", "jazz", "intimate", "harmon", "smoky"],
            "example": 'note("c5 e5 g5").s("gm_muted_trumpet")'
        },
        "gm_french_horn": {
            "description": "French horn. Noble, warm, orchestral. Romantic, cinematic, heroic.",
            "category": "brass",
            "tags": ["french-horn", "brass", "noble", "warm", "orchestral", "heroic", "cinematic"],
            "example": 'note("c4 e4 g4").s("gm_french_horn")'
        },
        "gm_brass_section": {
            "description": "Brass section ensemble. Powerful, big band, orchestral hits. Fanfares.",
            "category": "brass",
            "tags": ["brass", "section", "ensemble", "powerful", "big-band", "fanfare", "orchestral"],
            "example": 'note("<[c4,e4,g4] [d4,f4,a4]>").s("gm_brass_section")'
        },
        "gm_synth_brass_1": {
            "description": "Synth brass 1. Electronic brass stabs. 80s, disco, funk.",
            "category": "brass",
            "tags": ["brass", "synth", "stabs", "80s", "disco", "funk", "electronic"],
            "example": 'note("<[c4,e4,g4]>").s("gm_synth_brass_1")'
        },
        "gm_synth_brass_2": {
            "description": "Synth brass 2. Softer synth brass. Pads, atmospheric.",
            "category": "brass",
            "tags": ["brass", "synth", "soft", "pads", "atmospheric"],
            "example": 'note("<[c4,e4,g4]>").s("gm_synth_brass_2")'
        },

        # Woodwinds
        "gm_flute": {
            "description": "Concert flute. Airy, bright, agile. Classical, jazz, folk, world.",
            "category": "woodwind",
            "tags": ["flute", "woodwind", "airy", "bright", "classical", "folk"],
            "example": 'note("c5 e5 g5").s("gm_flute")'
        },
        "gm_piccolo": {
            "description": "Piccolo. Highest woodwind, piercing, brilliant. Marches, orchestral.",
            "category": "woodwind",
            "tags": ["piccolo", "woodwind", "high", "piercing", "brilliant", "march"],
            "example": 'note("c6 e6 g6").s("gm_piccolo")'
        },
        "gm_recorder": {
            "description": "Recorder. Renaissance, folk, educational. Soft, pure tone.",
            "category": "woodwind",
            "tags": ["recorder", "woodwind", "renaissance", "folk", "soft", "pure"],
            "example": 'note("c5 e5 g5").s("gm_recorder")'
        },
        "gm_pan_flute": {
            "description": "Pan flute. Breathy, ethnic, Andean. Mystical, world music.",
            "category": "woodwind",
            "tags": ["pan-flute", "woodwind", "breathy", "andean", "mystical", "world"],
            "example": 'note("c5 e5 g5").s("gm_pan_flute")'
        },
        "gm_blown_bottle": {
            "description": "Blown bottle. Airy, hollow, ethereal. Ambient textures.",
            "category": "woodwind",
            "tags": ["bottle", "blown", "airy", "hollow", "ethereal", "ambient"],
            "example": 'note("c5 e5 g5").s("gm_blown_bottle")'
        },
        "gm_shakuhachi": {
            "description": "Shakuhachi. Japanese bamboo flute. Zen, meditative, breathy.",
            "category": "woodwind",
            "tags": ["shakuhachi", "japanese", "bamboo", "zen", "meditative", "breathy", "world"],
            "example": 'note("c5 e5 g5").s("gm_shakuhachi")'
        },
        "gm_whistle": {
            "description": "Tin whistle. Irish, Celtic, folk. Bright, agile, jigs and reels.",
            "category": "woodwind",
            "tags": ["whistle", "tin-whistle", "irish", "celtic", "folk", "bright"],
            "example": 'note("c5 e5 g5").s("gm_whistle")'
        },
        "gm_ocarina": {
            "description": "Ocarina. Ancient wind instrument. Pure, innocent, video game nostalgia.",
            "category": "woodwind",
            "tags": ["ocarina", "ancient", "pure", "innocent", "zelda", "game"],
            "example": 'note("c5 e5 g5").s("gm_ocarina")'
        },
        "gm_clarinet": {
            "description": "Clarinet. Warm, woody, agile. Jazz, classical, klezmer.",
            "category": "woodwind",
            "tags": ["clarinet", "woodwind", "warm", "woody", "jazz", "classical", "klezmer"],
            "example": 'note("c4 e4 g4").s("gm_clarinet")'
        },
        "gm_oboe": {
            "description": "Oboe. Nasal, expressive, penetrating. Orchestral, pastoral.",
            "category": "woodwind",
            "tags": ["oboe", "woodwind", "nasal", "expressive", "orchestral", "pastoral"],
            "example": 'note("c5 e5 g5").s("gm_oboe")'
        },
        "gm_english_horn": {
            "description": "English horn, cor anglais. Melancholic, warm oboe family. Romantic.",
            "category": "woodwind",
            "tags": ["english-horn", "cor-anglais", "woodwind", "melancholic", "warm", "romantic"],
            "example": 'note("c4 e4 g4").s("gm_english_horn")'
        },
        "gm_bassoon": {
            "description": "Bassoon. Deep, reedy, sometimes comical. Orchestral bass woodwind.",
            "category": "woodwind",
            "tags": ["bassoon", "woodwind", "deep", "reedy", "orchestral", "bass"],
            "example": 'note("c3 e3 g3").s("gm_bassoon")'
        },
        "gm_soprano_sax": {
            "description": "Soprano saxophone. Bright, penetrating, Kenny G. Jazz, smooth jazz.",
            "category": "woodwind",
            "tags": ["saxophone", "soprano", "bright", "jazz", "smooth-jazz"],
            "example": 'note("c5 e5 g5").s("gm_soprano_sax")'
        },
        "gm_alto_sax": {
            "description": "Alto saxophone. Versatile, expressive. Jazz standard, R&B, pop.",
            "category": "woodwind",
            "tags": ["saxophone", "alto", "versatile", "jazz", "r&b", "pop"],
            "example": 'note("c4 e4 g4").s("gm_alto_sax")'
        },
        "gm_tenor_sax": {
            "description": "Tenor saxophone. Rich, powerful, soulful. Jazz, rock, R&B solos.",
            "category": "woodwind",
            "tags": ["saxophone", "tenor", "rich", "powerful", "soulful", "jazz", "rock"],
            "example": 'note("c4 e4 g4").s("gm_tenor_sax")'
        },
        "gm_baritone_sax": {
            "description": "Baritone saxophone. Deep, honking, powerful. Jazz, funk, rock.",
            "category": "woodwind",
            "tags": ["saxophone", "baritone", "deep", "honking", "funk", "jazz"],
            "example": 'note("c3 e3 g3").s("gm_baritone_sax")'
        },

        # Synth Lead
        "gm_lead_1_square": {
            "description": "Square wave lead. Retro, chiptune, 8-bit. Video game melodies.",
            "category": "synth_lead",
            "tags": ["synth", "lead", "square", "chiptune", "8-bit", "retro", "game"],
            "example": 'note("c5 e5 g5").s("gm_lead_1_square")'
        },
        "gm_lead_2_sawtooth": {
            "description": "Sawtooth wave lead. Bright, buzzy, classic synth. Trance, EDM.",
            "category": "synth_lead",
            "tags": ["synth", "lead", "sawtooth", "bright", "buzzy", "trance", "edm"],
            "example": 'note("c5 e5 g5").s("gm_lead_2_sawtooth")'
        },
        "gm_lead_3_calliope": {
            "description": "Calliope lead. Circus organ, carnival. Quirky, whimsical.",
            "category": "synth_lead",
            "tags": ["synth", "lead", "calliope", "circus", "carnival", "quirky"],
            "example": 'note("c5 e5 g5").s("gm_lead_3_calliope")'
        },
        "gm_lead_4_chiff": {
            "description": "Chiff lead. Breathy attack, pan flute-like. Airy, new age.",
            "category": "synth_lead",
            "tags": ["synth", "lead", "chiff", "breathy", "airy", "new-age"],
            "example": 'note("c5 e5 g5").s("gm_lead_4_chiff")'
        },
        "gm_lead_5_charang": {
            "description": "Charang lead. Distorted, aggressive synth. Rock, industrial.",
            "category": "synth_lead",
            "tags": ["synth", "lead", "charang", "distorted", "aggressive", "rock"],
            "example": 'note("c5 e5 g5").s("gm_lead_5_charang")'
        },
        "gm_lead_6_voice": {
            "description": "Voice lead synth. Vocal-like, choir synth. Ethereal, dreamy.",
            "category": "synth_lead",
            "tags": ["synth", "lead", "voice", "vocal", "choir", "ethereal", "dreamy"],
            "example": 'note("c5 e5 g5").s("gm_lead_6_voice")'
        },
        "gm_lead_7_fifths": {
            "description": "Fifths lead. Power chord synth, parallel fifths. Heavy, powerful.",
            "category": "synth_lead",
            "tags": ["synth", "lead", "fifths", "power-chord", "heavy", "powerful"],
            "example": 'note("c5 e5 g5").s("gm_lead_7_fifths")'
        },
        "gm_lead_8_bass_lead": {
            "description": "Bass and lead combo. Thick, full range synth. Monophonic bass-lead.",
            "category": "synth_lead",
            "tags": ["synth", "lead", "bass", "thick", "full", "monophonic"],
            "example": 'note("c4 e4 g4").s("gm_lead_8_bass_lead")'
        },

        # Synth Pad
        "gm_pad_1_new_age": {
            "description": "New age pad. Warm, evolving, meditation. Ambient, relaxation.",
            "category": "synth_pad",
            "tags": ["synth", "pad", "new-age", "warm", "ambient", "meditation", "relaxation"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_pad_1_new_age")'
        },
        "gm_pad_2_warm": {
            "description": "Warm pad. Analog-style warmth, rich harmonics. Lush, enveloping.",
            "category": "synth_pad",
            "tags": ["synth", "pad", "warm", "analog", "lush", "rich"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_pad_2_warm")'
        },
        "gm_pad_3_polysynth": {
            "description": "Polysynth pad. Classic 80s pad. Synthwave, retro, detuned.",
            "category": "synth_pad",
            "tags": ["synth", "pad", "polysynth", "80s", "synthwave", "retro", "detuned"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_pad_3_polysynth")'
        },
        "gm_pad_4_choir": {
            "description": "Choir pad. Vocal ensemble synth. Angelic, ethereal, sacred.",
            "category": "synth_pad",
            "tags": ["synth", "pad", "choir", "vocal", "angelic", "ethereal", "sacred"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_pad_4_choir")'
        },
        "gm_pad_5_bowed": {
            "description": "Bowed pad. String-like attack, evolving. Cinematic, tension.",
            "category": "synth_pad",
            "tags": ["synth", "pad", "bowed", "string-like", "cinematic", "tension"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_pad_5_bowed")'
        },
        "gm_pad_6_metallic": {
            "description": "Metallic pad. Bell-like, shimmering. Industrial, cold, futuristic.",
            "category": "synth_pad",
            "tags": ["synth", "pad", "metallic", "bell", "shimmering", "industrial", "cold"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_pad_6_metallic")'
        },
        "gm_pad_7_halo": {
            "description": "Halo pad. Bright, airy, heavenly. Ambient, uplifting.",
            "category": "synth_pad",
            "tags": ["synth", "pad", "halo", "bright", "airy", "heavenly", "ambient"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_pad_7_halo")'
        },
        "gm_pad_8_sweep": {
            "description": "Sweep pad. Filter sweep, evolving texture. Builds, transitions.",
            "category": "synth_pad",
            "tags": ["synth", "pad", "sweep", "filter", "evolving", "builds", "transitions"],
            "example": 'note("<[c3,e3,g3] [f3,a3,c4]>").s("gm_pad_8_sweep")'
        },

        # Synth Effects
        "gm_fx_1_rain": {
            "description": "Rain effect. Ambient rainfall texture. Weather, nature, atmosphere.",
            "category": "synth_fx",
            "tags": ["synth", "fx", "rain", "ambient", "weather", "nature", "atmosphere"],
            "example": 'note("c4").s("gm_fx_1_rain")'
        },
        "gm_fx_2_soundtrack": {
            "description": "Soundtrack effect. Cinematic texture, sci-fi. Film score, tension.",
            "category": "synth_fx",
            "tags": ["synth", "fx", "soundtrack", "cinematic", "sci-fi", "tension"],
            "example": 'note("c4").s("gm_fx_2_soundtrack")'
        },
        "gm_fx_3_crystal": {
            "description": "Crystal effect. Sparkling, magical. Fantasy, fairy tale.",
            "category": "synth_fx",
            "tags": ["synth", "fx", "crystal", "sparkling", "magical", "fantasy"],
            "example": 'note("c5").s("gm_fx_3_crystal")'
        },
        "gm_fx_4_atmosphere": {
            "description": "Atmosphere effect. Ambient drone, space. Sci-fi, suspense.",
            "category": "synth_fx",
            "tags": ["synth", "fx", "atmosphere", "ambient", "drone", "space", "sci-fi"],
            "example": 'note("c3").s("gm_fx_4_atmosphere")'
        },
        "gm_fx_5_brightness": {
            "description": "Brightness effect. Rising shimmer, uplifting. Transitions, builds.",
            "category": "synth_fx",
            "tags": ["synth", "fx", "brightness", "shimmer", "uplifting", "transitions"],
            "example": 'note("c4").s("gm_fx_5_brightness")'
        },
        "gm_fx_6_goblins": {
            "description": "Goblins effect. Dark, creepy texture. Horror, fantasy, tension.",
            "category": "synth_fx",
            "tags": ["synth", "fx", "goblins", "dark", "creepy", "horror", "fantasy"],
            "example": 'note("c3").s("gm_fx_6_goblins")'
        },
        "gm_fx_7_echoes": {
            "description": "Echoes effect. Delayed, spacious texture. Ambient, dub.",
            "category": "synth_fx",
            "tags": ["synth", "fx", "echoes", "delay", "spacious", "ambient", "dub"],
            "example": 'note("c4").s("gm_fx_7_echoes")'
        },
        "gm_fx_8_scifi": {
            "description": "Sci-fi effect. Futuristic, electronic texture. Space, technology.",
            "category": "synth_fx",
            "tags": ["synth", "fx", "scifi", "futuristic", "electronic", "space", "technology"],
            "example": 'note("c4").s("gm_fx_8_scifi")'
        },

        # Ethnic/World
        "gm_sitar": {
            "description": "Sitar. Indian classical string, drone strings. Raga, world, psychedelic.",
            "category": "ethnic",
            "tags": ["sitar", "indian", "world", "string", "raga", "psychedelic", "drone"],
            "example": 'note("c4 e4 g4").s("gm_sitar")'
        },
        "gm_banjo": {
            "description": "Banjo. Twangy, bright plucked. Bluegrass, country, folk, Americana.",
            "category": "ethnic",
            "tags": ["banjo", "bluegrass", "country", "folk", "americana", "twangy", "plucked"],
            "example": 'note("c4 e4 g4").s("gm_banjo")'
        },
        "gm_shamisen": {
            "description": "Shamisen. Japanese three-string lute. Traditional, folk, kabuki.",
            "category": "ethnic",
            "tags": ["shamisen", "japanese", "world", "traditional", "folk", "kabuki"],
            "example": 'note("c4 e4 g4").s("gm_shamisen")'
        },
        "gm_koto": {
            "description": "Koto. Japanese zither, 13 strings. Elegant, zen, traditional.",
            "category": "ethnic",
            "tags": ["koto", "japanese", "world", "zither", "elegant", "zen", "traditional"],
            "example": 'note("c4 e4 g4").s("gm_koto")'
        },
        "gm_kalimba": {
            "description": "Kalimba, thumb piano. African mbira. Mellow, plucky, world.",
            "category": "ethnic",
            "tags": ["kalimba", "mbira", "african", "world", "thumb-piano", "mellow", "plucky"],
            "example": 'note("c5 e5 g5").s("gm_kalimba")'
        },
        "gm_bagpipe": {
            "description": "Bagpipes. Scottish/Irish drone instrument. Celtic, ceremonial, powerful.",
            "category": "ethnic",
            "tags": ["bagpipe", "scottish", "irish", "celtic", "drone", "ceremonial", "powerful"],
            "example": 'note("c4 e4 g4").s("gm_bagpipe")'
        },
        "gm_fiddle": {
            "description": "Fiddle. Folk violin style. Celtic, bluegrass, country, energetic.",
            "category": "ethnic",
            "tags": ["fiddle", "violin", "folk", "celtic", "bluegrass", "country", "energetic"],
            "example": 'note("c5 e5 g5").s("gm_fiddle")'
        },
        "gm_shanai": {
            "description": "Shanai, shehnai. Indian double-reed. Weddings, celebrations, snake charmer.",
            "category": "ethnic",
            "tags": ["shanai", "shehnai", "indian", "world", "double-reed", "celebration"],
            "example": 'note("c5 e5 g5").s("gm_shanai")'
        },

        # Percussion
        "gm_timpani": {
            "description": "Timpani, kettle drums. Orchestral bass drums. Dramatic, thunderous.",
            "category": "percussion",
            "tags": ["timpani", "kettle-drums", "orchestral", "dramatic", "thunderous", "classical"],
            "example": 'note("c2 g2").s("gm_timpani")'
        },
        "gm_orchestra_hit": {
            "description": "Orchestra hit. Full orchestra stab. 80s, dramatic, impact.",
            "category": "percussion",
            "tags": ["orchestra-hit", "stab", "80s", "dramatic", "impact", "orchestral"],
            "example": 'note("c4").s("gm_orchestra_hit")'
        },
        "gm_melodic_tom": {
            "description": "Melodic tom drums. Tuned toms, tribal. Tom fills, ethnic.",
            "category": "percussion",
            "tags": ["tom", "melodic", "tuned", "tribal", "ethnic", "fills"],
            "example": 'note("c3 e3 g3").s("gm_melodic_tom")'
        },
        "gm_synth_drum": {
            "description": "Synth drum. Electronic drum hit. 80s, electronic, processed.",
            "category": "percussion",
            "tags": ["drum", "synth", "electronic", "80s", "processed"],
            "example": 'note("c3").s("gm_synth_drum")'
        },
        "gm_taiko_drum": {
            "description": "Taiko drum. Japanese big drum. Powerful, ceremonial, epic.",
            "category": "percussion",
            "tags": ["taiko", "japanese", "drum", "powerful", "ceremonial", "epic"],
            "example": 'note("c2").s("gm_taiko_drum")'
        },
        "gm_woodblock": {
            "description": "Woodblock. Hollow wooden percussion. Latin, orchestral, click.",
            "category": "percussion",
            "tags": ["woodblock", "wooden", "percussion", "latin", "orchestral", "click"],
            "example": 's("gm_woodblock")'
        },
        "gm_steel_drums": {
            "description": "Steel drums, steel pans. Caribbean, tropical. Bright, melodic, calypso.",
            "category": "percussion",
            "tags": ["steel-drums", "caribbean", "tropical", "calypso", "bright", "melodic"],
            "example": 'note("c5 e5 g5").s("gm_steel_drums")'
        },

        # Sound Effects
        "gm_applause": {
            "description": "Applause sound effect. Audience clapping. Endings, live feel.",
            "category": "sound_fx",
            "tags": ["applause", "clapping", "audience", "sfx", "live"],
            "example": 's("gm_applause")'
        },
        "gm_gunshot": {
            "description": "Gunshot sound effect. Explosive impact. Action, cinematic.",
            "category": "sound_fx",
            "tags": ["gunshot", "explosion", "impact", "sfx", "action"],
            "example": 's("gm_gunshot")'
        },
        "gm_helicopter": {
            "description": "Helicopter sound effect. Rotor blades, aviation. Cinematic, action.",
            "category": "sound_fx",
            "tags": ["helicopter", "aviation", "sfx", "cinematic", "action"],
            "example": 's("gm_helicopter")'
        },
        "gm_seashore": {
            "description": "Seashore sound effect. Ocean waves, beach ambience. Relaxation, nature.",
            "category": "sound_fx",
            "tags": ["seashore", "ocean", "waves", "beach", "sfx", "relaxation", "nature"],
            "example": 's("gm_seashore")'
        },
        "gm_bird_tweet": {
            "description": "Bird tweet sound effect. Birdsong, nature. Morning, forest, peaceful.",
            "category": "sound_fx",
            "tags": ["bird", "tweet", "nature", "sfx", "morning", "forest", "peaceful"],
            "example": 's("gm_bird_tweet")'
        },
        "gm_telephone_ring": {
            "description": "Telephone ring sound effect. Classic phone ring. Retro, communication.",
            "category": "sound_fx",
            "tags": ["telephone", "ring", "phone", "sfx", "retro", "communication"],
            "example": 's("gm_telephone_ring")'
        },
        "gm_breath_noise": {
            "description": "Breath noise effect. Wind, breathing sound. Ambient, human, intimate.",
            "category": "sound_fx",
            "tags": ["breath", "wind", "noise", "sfx", "ambient", "human"],
            "example": 's("gm_breath_noise")'
        },
    }

    # Add GM soundfonts to catalog
    for name, data in gm_soundfonts.items():
        sounds.append({
            "id": name,
            "name": name,
            "description": data["description"],
            "source": "soundfonts",
            "category": data["category"],
            "tags": data["tags"],
            "example": data["example"]
        })

    # ===========================================
    # DIRT SAMPLES (from tidalcycles/dirt-samples)
    # Complete list of ~200 sample banks
    # ===========================================

    # Full dirt-samples catalog with descriptions
    dirt_samples = {
        # 808 Drum Machine Family
        "808": {"description": "Roland TR-808 drum machine. Classic hip-hop, electronic. Full kit - kicks, snares, hats, claps.", "category": "drum_machine", "tags": ["808", "roland", "drum-machine", "hip-hop", "electronic", "classic"]},
        "808bd": {"description": "TR-808 bass drum, kick. Deep, boomy, iconic hip-hop kick.", "category": "drums", "tags": ["808", "kick", "bass-drum", "hip-hop", "deep", "boomy"]},
        "808cy": {"description": "TR-808 cymbal. Metallic, splashy crash.", "category": "drums", "tags": ["808", "cymbal", "crash", "metallic"]},
        "808hc": {"description": "TR-808 high conga. Latin percussion, electronic.", "category": "drums", "tags": ["808", "conga", "high", "latin", "percussion"]},
        "808ht": {"description": "TR-808 high tom. Pitched tom sound.", "category": "drums", "tags": ["808", "tom", "high", "pitched"]},
        "808lc": {"description": "TR-808 low conga. Deep latin percussion.", "category": "drums", "tags": ["808", "conga", "low", "latin", "deep"]},
        "808lt": {"description": "TR-808 low tom. Deep pitched tom.", "category": "drums", "tags": ["808", "tom", "low", "deep"]},
        "808mc": {"description": "TR-808 mid conga. Medium latin percussion.", "category": "drums", "tags": ["808", "conga", "mid", "latin"]},
        "808mt": {"description": "TR-808 mid tom. Medium pitched tom.", "category": "drums", "tags": ["808", "tom", "mid"]},
        "808oh": {"description": "TR-808 open hi-hat. Sizzling, sustained hat.", "category": "drums", "tags": ["808", "hi-hat", "open", "sizzle"]},
        "808sd": {"description": "TR-808 snare drum. Crisp, snappy electronic snare.", "category": "drums", "tags": ["808", "snare", "crisp", "electronic"]},

        # 909 Drum Machine
        "909": {"description": "Roland TR-909 drum machine. House, techno essential. Punchy kicks, crisp hats.", "category": "drum_machine", "tags": ["909", "roland", "drum-machine", "house", "techno", "punchy"]},

        # Alphabetical dirt-samples
        "ab": {"description": "Abstract sounds. Experimental, textural, unusual.", "category": "experimental", "tags": ["abstract", "experimental", "texture", "unusual"]},
        "ade": {"description": "Ade sample pack. Electronic textures.", "category": "electronic", "tags": ["ade", "electronic", "texture"]},
        "ades2": {"description": "Ade sample pack 2. More electronic sounds.", "category": "electronic", "tags": ["ade", "electronic", "variant"]},
        "ades3": {"description": "Ade sample pack 3. Electronic continuation.", "category": "electronic", "tags": ["ade", "electronic", "variant"]},
        "ades4": {"description": "Ade sample pack 4. Electronic sounds.", "category": "electronic", "tags": ["ade", "electronic", "variant"]},
        "alex": {"description": "Alex sample collection. Various sounds.", "category": "misc", "tags": ["alex", "collection", "various"]},
        "alphabet": {"description": "Alphabet spoken letters. A to Z voice samples.", "category": "vocal", "tags": ["alphabet", "letters", "voice", "speech", "educational"]},
        "amencutup": {"description": "Amen break chopped. Classic breakbeat sliced. Jungle, drum and bass.", "category": "breaks", "tags": ["amen", "breakbeat", "chopped", "jungle", "dnb", "classic"]},
        "armora": {"description": "Armora sounds. Metallic, armored textures.", "category": "experimental", "tags": ["armora", "metallic", "texture"]},
        "arp": {"description": "Arpeggio sounds. Sequenced melodic patterns.", "category": "melodic", "tags": ["arpeggio", "sequence", "melodic", "pattern"]},
        "arpy": {"description": "Arpy synth. Short plucky synth for arpeggios. Electronic, chiptune-ish.", "category": "melodic", "tags": ["arpeggio", "synth", "plucky", "electronic"]},
        "auto": {"description": "Auto sounds. Automotive, mechanical.", "category": "sfx", "tags": ["auto", "car", "mechanical", "engine"]},

        # B samples
        "baa": {"description": "Baa sheep sound. Animal bleat.", "category": "sfx", "tags": ["sheep", "animal", "bleat", "farm"]},
        "baa2": {"description": "Baa sheep variant. Different sheep sounds.", "category": "sfx", "tags": ["sheep", "animal", "bleat", "variant"]},
        "bass": {"description": "Bass samples. General bass sounds. Low frequency foundation.", "category": "bass", "tags": ["bass", "low", "foundation"]},
        "bass0": {"description": "Bass variant 0. Alternative bass character.", "category": "bass", "tags": ["bass", "variant", "low"]},
        "bass1": {"description": "Bass variant 1. Different bass timbre.", "category": "bass", "tags": ["bass", "variant", "low"]},
        "bass2": {"description": "Bass variant 2. Another bass flavor.", "category": "bass", "tags": ["bass", "variant", "low"]},
        "bass3": {"description": "Bass variant 3. Extended bass options.", "category": "bass", "tags": ["bass", "variant", "low"]},
        "bassdm": {"description": "Bass drum samples. Kick drums, low percussion.", "category": "drums", "tags": ["bass", "drum", "kick", "low"]},
        "bassfoo": {"description": "Bass foo experimental. Unusual bass sounds.", "category": "bass", "tags": ["bass", "experimental", "unusual"]},
        "battles": {"description": "Battle sounds. Combat, action, warfare.", "category": "sfx", "tags": ["battle", "combat", "action", "warfare"]},
        "bd": {"description": "Bass drum, kick drum. Electronic and acoustic kicks. Foundation of rhythm.", "category": "drums", "tags": ["kick", "bass-drum", "drums", "rhythm", "foundation"]},
        "bend": {"description": "Bend sounds. Pitch bending, gliding tones.", "category": "melodic", "tags": ["bend", "pitch", "glide", "tone"]},
        "bev": {"description": "Bev sample collection. Various sounds.", "category": "misc", "tags": ["bev", "collection", "various"]},
        "bin": {"description": "Binary sounds. Digital, computer-like.", "category": "electronic", "tags": ["binary", "digital", "computer", "data"]},
        "birds": {"description": "Bird sounds. Birdsong, nature, chirping.", "category": "sfx", "tags": ["birds", "nature", "chirp", "wildlife"]},
        "birds3": {"description": "Birds variant 3. More bird sounds.", "category": "sfx", "tags": ["birds", "nature", "chirp", "variant"]},
        "bleep": {"description": "Bleep sounds. Electronic beeps, UI sounds.", "category": "electronic", "tags": ["bleep", "beep", "electronic", "ui"]},
        "blip": {"description": "Blip sounds. Short electronic beep. Glitch, UI, accent.", "category": "electronic", "tags": ["blip", "beep", "electronic", "glitch", "ui"]},
        "blue": {"description": "Blue sample collection. Various sounds.", "category": "misc", "tags": ["blue", "collection", "various"]},
        "bottle": {"description": "Bottle sounds. Glass, blown bottle, percussion.", "category": "percussion", "tags": ["bottle", "glass", "blown", "percussion"]},
        "breaks125": {"description": "Breakbeat loops at 125 BPM. House tempo breaks.", "category": "breaks", "tags": ["breakbeat", "125bpm", "house", "loop"]},
        "breaks152": {"description": "Breakbeat loops at 152 BPM. DnB tempo breaks.", "category": "breaks", "tags": ["breakbeat", "152bpm", "dnb", "loop"]},
        "breaks157": {"description": "Breakbeat loops at 157 BPM. Fast breaks.", "category": "breaks", "tags": ["breakbeat", "157bpm", "fast", "loop"]},
        "breaks165": {"description": "Breakbeat loops at 165 BPM. Jungle tempo.", "category": "breaks", "tags": ["breakbeat", "165bpm", "jungle", "loop"]},
        "breath": {"description": "Breath sounds. Human breathing, wind.", "category": "sfx", "tags": ["breath", "human", "wind", "air"]},
        "bubble": {"description": "Bubble sounds. Water bubbles, underwater.", "category": "sfx", "tags": ["bubble", "water", "underwater", "liquid"]},

        # C samples
        "can": {"description": "Can sounds. Metal can, percussion.", "category": "percussion", "tags": ["can", "metal", "percussion", "found-sound"]},
        "casio": {"description": "Casio keyboard. Lo-fi keys, toy keyboard character. Nostalgic, lo-fi.", "category": "melodic", "tags": ["casio", "keyboard", "lo-fi", "toy", "nostalgic"]},
        "cb": {"description": "Cowbell. Metallic percussion. Funk, latin, electronic classic.", "category": "drums", "tags": ["cowbell", "percussion", "metallic", "funk", "latin"]},
        "cc": {"description": "CC samples. Various control sounds.", "category": "misc", "tags": ["cc", "control", "various"]},
        "chin": {"description": "China cymbal or chin sounds. Trashy cymbal.", "category": "drums", "tags": ["china", "cymbal", "trashy", "crash"]},
        "circus": {"description": "Circus sounds. Carnival, whimsical, fun.", "category": "sfx", "tags": ["circus", "carnival", "whimsical", "fun"]},
        "clak": {"description": "Clak percussion. Click, clack sounds.", "category": "percussion", "tags": ["clak", "click", "clack", "percussion"]},
        "click": {"description": "Click sounds. Digital clicks, percussion.", "category": "percussion", "tags": ["click", "digital", "percussion", "ui"]},
        "clubkick": {"description": "Club kick drums. Big room, EDM kicks.", "category": "drums", "tags": ["kick", "club", "edm", "big-room"]},
        "co": {"description": "Co sample collection. Various sounds.", "category": "misc", "tags": ["co", "collection", "various"]},
        "coins": {"description": "Coin sounds. Money, jingling, arcade.", "category": "sfx", "tags": ["coins", "money", "jingle", "arcade"]},
        "control": {"description": "Control sounds. Buttons, switches, UI.", "category": "sfx", "tags": ["control", "button", "switch", "ui"]},
        "cosmicg": {"description": "Cosmic G sounds. Space, sci-fi textures.", "category": "electronic", "tags": ["cosmic", "space", "sci-fi", "texture"]},
        "cp": {"description": "Clap, hand clap. Snappy, layered clap sound. Electronic music staple.", "category": "drums", "tags": ["clap", "handclap", "drums", "snappy"]},
        "cr": {"description": "Crash cymbal. Explosive cymbal hit. Accents, transitions.", "category": "drums", "tags": ["crash", "cymbal", "drums", "accent", "transition"]},
        "crow": {"description": "Crow sounds. Bird caw, nature.", "category": "sfx", "tags": ["crow", "bird", "caw", "nature"]},

        # D samples
        "d": {"description": "D sample collection. Various drum sounds.", "category": "drums", "tags": ["d", "drums", "collection"]},
        "db": {"description": "DB samples. Database or deep bass.", "category": "bass", "tags": ["db", "deep", "bass"]},
        "diphone": {"description": "Diphone speech synthesis. Robotic voice.", "category": "vocal", "tags": ["diphone", "speech", "synthesis", "robotic"]},
        "diphone2": {"description": "Diphone variant 2. More speech synthesis.", "category": "vocal", "tags": ["diphone", "speech", "synthesis", "variant"]},
        "dist": {"description": "Distorted sounds. Heavy distortion, aggressive.", "category": "electronic", "tags": ["distortion", "heavy", "aggressive", "noise"]},
        "dork2": {"description": "Dork sounds 2. Quirky, unusual.", "category": "experimental", "tags": ["dork", "quirky", "unusual", "fun"]},
        "dorkbot": {"description": "Dorkbot sounds. Electronic, robotic.", "category": "electronic", "tags": ["dorkbot", "electronic", "robotic"]},
        "dr": {"description": "DR drum samples. Various drums.", "category": "drums", "tags": ["dr", "drums", "various"]},
        "dr2": {"description": "DR drums variant 2.", "category": "drums", "tags": ["dr", "drums", "variant"]},
        "dr55": {"description": "DR-55 drum machine. Boss Doctor Rhythm.", "category": "drum_machine", "tags": ["dr55", "boss", "drum-machine", "vintage"]},
        "dr_few": {"description": "DR few selected drums.", "category": "drums", "tags": ["dr", "drums", "selected"]},
        "drum": {"description": "General drum samples. Various drum hits.", "category": "drums", "tags": ["drum", "hits", "various"]},
        "drumtraks": {"description": "Sequential DrumTraks samples. Vintage drum machine.", "category": "drum_machine", "tags": ["drumtraks", "sequential", "drum-machine", "vintage"]},

        # E samples
        "e": {"description": "E sample collection. Electronic sounds.", "category": "electronic", "tags": ["e", "electronic", "collection"]},
        "east": {"description": "East sounds. Eastern, Asian influenced.", "category": "world", "tags": ["east", "asian", "eastern", "world"]},
        "electro1": {"description": "Electro sounds 1. Electronic, 80s electro.", "category": "electronic", "tags": ["electro", "80s", "electronic", "breakdance"]},
        "em2": {"description": "EM2 samples. Electronic music.", "category": "electronic", "tags": ["em2", "electronic", "music"]},
        "erk": {"description": "Erk sounds. Unusual, experimental.", "category": "experimental", "tags": ["erk", "unusual", "experimental"]},

        # F samples
        "f": {"description": "F sample collection. Various sounds.", "category": "misc", "tags": ["f", "collection", "various"]},
        "feel": {"description": "Feel samples. Textural, emotional.", "category": "experimental", "tags": ["feel", "texture", "emotional"]},
        "feelfx": {"description": "Feel effects. Atmospheric, textural FX.", "category": "sfx", "tags": ["feel", "fx", "atmospheric", "texture"]},
        "fest": {"description": "Festival sounds. Crowd, celebration.", "category": "sfx", "tags": ["festival", "crowd", "celebration"]},
        "fire": {"description": "Fire sounds. Flames, crackling.", "category": "sfx", "tags": ["fire", "flames", "crackling", "nature"]},
        "flick": {"description": "Flick sounds. Quick, snappy.", "category": "percussion", "tags": ["flick", "quick", "snappy"]},
        "fm": {"description": "FM synthesis sounds. Digital, bell-like, metallic.", "category": "melodic", "tags": ["fm", "synthesis", "digital", "bell", "metallic"]},
        "foo": {"description": "Foo samples. Various experimental sounds.", "category": "experimental", "tags": ["foo", "experimental", "various"]},
        "future": {"description": "Future sounds. Futuristic, sci-fi.", "category": "electronic", "tags": ["future", "futuristic", "sci-fi"]},

        # G samples
        "gab": {"description": "Gabber sounds. Hardcore, distorted.", "category": "electronic", "tags": ["gabber", "hardcore", "distorted", "fast"]},
        "gabba": {"description": "Gabba kicks. Hardcore techno kicks.", "category": "drums", "tags": ["gabba", "hardcore", "kick", "distorted"]},
        "gabbaloud": {"description": "Gabba loud. Louder hardcore kicks.", "category": "drums", "tags": ["gabba", "hardcore", "loud", "kick"]},
        "gabbalouder": {"description": "Gabba even louder. Maximum hardcore.", "category": "drums", "tags": ["gabba", "hardcore", "loudest", "extreme"]},
        "glasstap": {"description": "Glass tap sounds. Delicate, percussive.", "category": "percussion", "tags": ["glass", "tap", "delicate", "percussion"]},
        "glitch": {"description": "Glitch sounds. Digital artifacts, errors. Experimental, IDM.", "category": "electronic", "tags": ["glitch", "digital", "error", "idm", "experimental"]},
        "glitch2": {"description": "Glitch variant 2. More digital artifacts.", "category": "electronic", "tags": ["glitch", "digital", "variant"]},
        "gretsch": {"description": "Gretsch drum kit. Acoustic drum samples.", "category": "drums", "tags": ["gretsch", "acoustic", "drum-kit"]},
        "gtr": {"description": "Electric guitar samples. Short stabs, limited. Guitar character.", "category": "guitar", "tags": ["guitar", "electric", "stabs"]},

        # H samples
        "h": {"description": "H sample collection. Various sounds.", "category": "misc", "tags": ["h", "collection", "various"]},
        "hand": {"description": "Hand sounds. Claps, snaps, body percussion.", "category": "percussion", "tags": ["hand", "clap", "snap", "body-percussion"]},
        "hardcore": {"description": "Hardcore sounds. Intense, aggressive.", "category": "electronic", "tags": ["hardcore", "intense", "aggressive"]},
        "hardkick": {"description": "Hard kick drums. Punchy, powerful kicks.", "category": "drums", "tags": ["kick", "hard", "punchy", "powerful"]},
        "haw": {"description": "Haw sounds. Various samples.", "category": "misc", "tags": ["haw", "various"]},
        "hc": {"description": "Hardcore sounds or high conga.", "category": "drums", "tags": ["hc", "hardcore", "conga"]},
        "hh": {"description": "Hi-hat, closed hi-hat. Tight, crisp high-frequency rhythm.", "category": "drums", "tags": ["hi-hat", "hihat", "drums", "crisp"]},
        "hh27": {"description": "Hi-hat collection 27. Multiple hi-hat sounds.", "category": "drums", "tags": ["hi-hat", "collection", "variety"]},
        "hit": {"description": "Hit sounds. Impact, stabs.", "category": "sfx", "tags": ["hit", "impact", "stab"]},
        "hmm": {"description": "Hmm vocal sounds. Thinking, contemplation.", "category": "vocal", "tags": ["hmm", "vocal", "thinking"]},
        "ho": {"description": "Ho sounds. Vocal exclamations.", "category": "vocal", "tags": ["ho", "vocal", "exclamation"]},
        "hoover": {"description": "Hoover bass. Classic rave sound, mentasm.", "category": "bass", "tags": ["hoover", "rave", "mentasm", "bass"]},
        "house": {"description": "House music samples. 4/4 beats, grooves.", "category": "electronic", "tags": ["house", "4/4", "groove", "electronic"]},
        "ht": {"description": "High tom drum. High pitched tom. Fills, rolls.", "category": "drums", "tags": ["tom", "high", "fills"]},

        # I samples
        "if": {"description": "IF samples. Conditional, experimental.", "category": "experimental", "tags": ["if", "experimental"]},
        "ifdrums": {"description": "IF drums. Experimental drum sounds.", "category": "drums", "tags": ["if", "drums", "experimental"]},
        "incoming": {"description": "Incoming sounds. Approaching, building.", "category": "sfx", "tags": ["incoming", "approach", "build"]},
        "industrial": {"description": "Industrial sounds. Factory, mechanical, harsh.", "category": "electronic", "tags": ["industrial", "factory", "mechanical", "harsh"]},
        "insect": {"description": "Insect sounds. Bugs, buzzing, nature.", "category": "sfx", "tags": ["insect", "bugs", "buzzing", "nature"]},
        "invaders": {"description": "Space invaders sounds. Retro arcade, 8-bit.", "category": "electronic", "tags": ["invaders", "arcade", "8-bit", "retro", "game"]},

        # J samples
        "jazz": {"description": "Jazz samples. Jazz drum kit, brushes.", "category": "drums", "tags": ["jazz", "brushes", "acoustic", "swing"]},
        "jungbass": {"description": "Jungle bass. Sub-heavy bass for drum and bass, jungle. Deep, rolling.", "category": "bass", "tags": ["jungle", "bass", "dnb", "sub", "deep"]},
        "jungle": {"description": "Jungle samples. Breakbeat, DnB drums.", "category": "breaks", "tags": ["jungle", "breakbeat", "dnb", "drums"]},
        "juno": {"description": "Juno synth. Roland Juno character. Warm, analog, classic.", "category": "melodic", "tags": ["juno", "roland", "synth", "analog", "warm"]},
        "jvbass": {"description": "JV bass. Roland JV synth bass. Punchy, electronic.", "category": "bass", "tags": ["jv", "roland", "bass", "synth", "punchy"]},

        # K samples
        "kicklinn": {"description": "Linn kick drums. LinnDrum kicks.", "category": "drums", "tags": ["linn", "kick", "drum-machine", "80s"]},
        "koy": {"description": "Koy samples. Various sounds.", "category": "misc", "tags": ["koy", "various"]},
        "kurt": {"description": "Kurt samples. Various sounds.", "category": "misc", "tags": ["kurt", "various"]},

        # L samples
        "latibro": {"description": "Latin brother samples. Latin percussion.", "category": "percussion", "tags": ["latin", "percussion", "brother"]},
        "led": {"description": "LED sounds. Electronic, digital.", "category": "electronic", "tags": ["led", "electronic", "digital"]},
        "less": {"description": "Less samples. Minimal sounds.", "category": "minimal", "tags": ["less", "minimal"]},
        "lighter": {"description": "Lighter sounds. Click, flame.", "category": "sfx", "tags": ["lighter", "click", "flame"]},
        "linnhats": {"description": "LinnDrum hi-hats. Classic 80s hats.", "category": "drums", "tags": ["linn", "hi-hat", "80s", "drum-machine"]},
        "lt": {"description": "Low tom drum. Deep tom hit. Fills, tribal, floor tom.", "category": "drums", "tags": ["tom", "low", "deep", "tribal"]},

        # M samples
        "made": {"description": "Made samples. Various processed sounds.", "category": "misc", "tags": ["made", "processed", "various"]},
        "made2": {"description": "Made samples variant 2.", "category": "misc", "tags": ["made", "variant"]},
        "mash": {"description": "Mash samples. Mashup, mixed sounds.", "category": "electronic", "tags": ["mash", "mashup", "mixed"]},
        "mash2": {"description": "Mash samples variant 2.", "category": "electronic", "tags": ["mash", "variant"]},
        "metal": {"description": "Metal sounds. Heavy, metallic, industrial.", "category": "electronic", "tags": ["metal", "heavy", "metallic", "industrial"]},
        "miniyeah": {"description": "Mini yeah vocal. Short vocal sample.", "category": "vocal", "tags": ["yeah", "vocal", "short"]},
        "monsterb": {"description": "Monster bass. Heavy, aggressive bass.", "category": "bass", "tags": ["monster", "bass", "heavy", "aggressive"]},
        "moog": {"description": "Moog synth. Moog synthesizer sounds. Fat, analog, bass-capable.", "category": "melodic", "tags": ["moog", "synth", "analog", "fat"]},
        "mouth": {"description": "Mouth sounds. Human mouth percussion. Beatbox-like.", "category": "vocal", "tags": ["mouth", "beatbox", "percussion", "human"]},
        "mp3": {"description": "MP3 artifacts. Compressed audio sounds.", "category": "electronic", "tags": ["mp3", "compressed", "artifact", "digital"]},
        "msg": {"description": "Message sounds. Communication, notification.", "category": "sfx", "tags": ["message", "notification", "communication"]},
        "mt": {"description": "Mid tom drum. Medium pitched tom. Fills.", "category": "drums", "tags": ["tom", "mid", "fills"]},
        "mute": {"description": "Muted sounds. Dampened, quiet.", "category": "misc", "tags": ["mute", "dampened", "quiet"]},

        # N samples
        "newnotes": {"description": "New notes. Fresh melodic content.", "category": "melodic", "tags": ["notes", "melodic", "new"]},
        "noise": {"description": "Noise samples. White noise, static. Texture, fills, risers.", "category": "electronic", "tags": ["noise", "white-noise", "static", "texture"]},
        "noise2": {"description": "Noise variant 2. More noise textures.", "category": "electronic", "tags": ["noise", "variant", "texture"]},
        "notes": {"description": "Notes samples. Melodic sounds.", "category": "melodic", "tags": ["notes", "melodic"]},
        "num": {"description": "Number sounds. Numeric, counting audio.", "category": "vocal", "tags": ["num", "number", "count", "digits"]},
        "numbers": {"description": "Number spoken samples. Count, digits.", "category": "vocal", "tags": ["numbers", "count", "digits", "speech"]},

        # O samples
        "oc": {"description": "OC samples. Various sounds.", "category": "misc", "tags": ["oc", "various"]},
        "odx": {"description": "ODX samples. Electronic sounds.", "category": "electronic", "tags": ["odx", "electronic"]},
        "off": {"description": "Off sounds. Switch off, ending.", "category": "sfx", "tags": ["off", "switch", "ending"]},
        "outdoor": {"description": "Outdoor sounds. Nature, ambient.", "category": "sfx", "tags": ["outdoor", "nature", "ambient"]},

        # P samples
        "pad": {"description": "Synth pad. Sustained atmospheric sound. Chords, ambient, background.", "category": "pads", "tags": ["pad", "synth", "ambient", "atmospheric"]},
        "padlong": {"description": "Long pad. Extended sustain pad. Drones, ambient, evolving.", "category": "pads", "tags": ["pad", "long", "drone", "ambient"]},
        "pebbles": {"description": "Pebble sounds. Stones, gravel.", "category": "sfx", "tags": ["pebbles", "stones", "gravel"]},
        "perc": {"description": "General percussion. Various percussion hits. Fills, accents.", "category": "percussion", "tags": ["percussion", "hits", "fills"]},
        "peri": {"description": "Peri samples. Peripheral sounds.", "category": "misc", "tags": ["peri", "peripheral"]},
        "pluck": {"description": "Plucked string. Generic pluck sound. Melodic, pizzicato-like.", "category": "melodic", "tags": ["pluck", "string", "melodic"]},
        "popkick": {"description": "Pop kick drums. Modern pop kicks.", "category": "drums", "tags": ["kick", "pop", "modern"]},
        "print": {"description": "Print sounds. Printer, mechanical.", "category": "sfx", "tags": ["print", "printer", "mechanical"]},
        "proc": {"description": "Processed sounds. Manipulated audio.", "category": "electronic", "tags": ["processed", "manipulated"]},
        "procshort": {"description": "Short processed sounds.", "category": "electronic", "tags": ["processed", "short"]},
        "psr": {"description": "PSR keyboard sounds. Yamaha PSR.", "category": "melodic", "tags": ["psr", "yamaha", "keyboard"]},

        # R samples
        "rave": {"description": "Rave sounds. 90s rave, stabs, hits.", "category": "electronic", "tags": ["rave", "90s", "stabs", "rave-culture"]},
        "rave2": {"description": "Rave sounds variant 2. More rave content.", "category": "electronic", "tags": ["rave", "variant"]},
        "ravemono": {"description": "Rave mono sounds. Monophonic rave.", "category": "electronic", "tags": ["rave", "mono"]},
        "realclaps": {"description": "Real claps. Acoustic hand claps.", "category": "drums", "tags": ["clap", "real", "acoustic"]},
        "reverbkick": {"description": "Reverb kick. Kicks with reverb tail.", "category": "drums", "tags": ["kick", "reverb", "tail"]},
        "rm": {"description": "RM samples. Ring modulation sounds.", "category": "electronic", "tags": ["rm", "ring-modulation"]},
        "rs": {"description": "Rimshot samples. Sharp rim hits.", "category": "drums", "tags": ["rimshot", "rim", "sharp"]},

        # S samples
        "sax": {"description": "Saxophone samples. Jazz, R&B sax.", "category": "melodic", "tags": ["saxophone", "sax", "jazz", "r&b"]},
        "sd": {"description": "Snare drum. Sharp, cracking backbeat. Essential drum sound.", "category": "drums", "tags": ["snare", "drums", "backbeat"]},
        "seawolf": {"description": "Sea wolf sounds. Ocean, nautical.", "category": "sfx", "tags": ["sea", "wolf", "ocean", "nautical"]},
        "sequential": {"description": "Sequential sounds. Ordered, sequenced.", "category": "electronic", "tags": ["sequential", "ordered", "sequence"]},
        "sf": {"description": "SF sounds. Science fiction.", "category": "sfx", "tags": ["sf", "sci-fi", "science-fiction"]},
        "sheffield": {"description": "Sheffield sounds. UK electronic.", "category": "electronic", "tags": ["sheffield", "uk", "electronic"]},
        "short": {"description": "Short sounds. Brief, staccato.", "category": "misc", "tags": ["short", "brief", "staccato"]},
        "sid": {"description": "SID chip sounds. C64, 8-bit.", "category": "electronic", "tags": ["sid", "c64", "8-bit", "chiptune"]},
        "simplesine": {"description": "Simple sine wave. Pure, clean sine tone. Fundamental, sub bass, test tone.", "category": "melodic", "tags": ["sine", "simple", "pure", "test-tone", "sub"]},
        "sine": {"description": "Sine wave samples. Pure tone.", "category": "melodic", "tags": ["sine", "pure", "tone"]},
        "sitar": {"description": "Sitar samples. Indian string instrument. World, psychedelic.", "category": "world", "tags": ["sitar", "indian", "world"]},
        "sn": {"description": "Snare drum alternate. Different snare character.", "category": "drums", "tags": ["snare", "alternate"]},
        "space": {"description": "Space sounds. Cosmic, sci-fi.", "category": "sfx", "tags": ["space", "cosmic", "sci-fi"]},
        "speakspell": {"description": "Speak and spell sounds. Retro toy.", "category": "vocal", "tags": ["speak-spell", "retro", "toy"]},
        "speech": {"description": "Speech samples. Spoken word.", "category": "vocal", "tags": ["speech", "spoken", "word"]},
        "speechless": {"description": "Speechless sounds. Non-verbal.", "category": "vocal", "tags": ["speechless", "non-verbal"]},
        "speedupdown": {"description": "Speed up/down sounds. Tempo effects.", "category": "sfx", "tags": ["speed", "tempo", "effect"]},
        "stab": {"description": "Synth stab. Short chord hit. House, disco, rhythmic chords.", "category": "melodic", "tags": ["stab", "chord", "house"]},
        "stomp": {"description": "Stomp sounds. Foot stomps, body percussion.", "category": "percussion", "tags": ["stomp", "foot", "body-percussion"]},
        "subroc3d": {"description": "Sub Roc 3D game sounds. Retro arcade.", "category": "electronic", "tags": ["subroc", "arcade", "retro", "game"]},
        "sugar": {"description": "Sugar samples. Sweet, pleasant sounds.", "category": "misc", "tags": ["sugar", "sweet", "pleasant"]},
        "sundance": {"description": "Sundance samples. Festival, outdoor.", "category": "misc", "tags": ["sundance", "festival"]},

        # T samples
        "tabla": {"description": "Tabla drums. Indian classical percussion. Intricate, melodic drums.", "category": "world", "tags": ["tabla", "indian", "percussion"]},
        "tabla2": {"description": "Tabla drums variant. More tabla sounds.", "category": "world", "tags": ["tabla", "indian", "variant"]},
        "tablex": {"description": "Tabla extended. More tabla samples.", "category": "world", "tags": ["tabla", "extended"]},
        "tacscan": {"description": "Tac Scan game sounds. Retro arcade.", "category": "electronic", "tags": ["tacscan", "arcade", "retro"]},
        "tech": {"description": "Tech sounds. Technical, electronic.", "category": "electronic", "tags": ["tech", "technical", "electronic"]},
        "techno": {"description": "Techno samples. Techno drums, sounds.", "category": "electronic", "tags": ["techno", "drums", "electronic"]},
        "tink": {"description": "Tink sounds. Small metallic hits.", "category": "percussion", "tags": ["tink", "metallic", "small"]},
        "tok": {"description": "Tok sounds. Click, tock.", "category": "percussion", "tags": ["tok", "click", "tock"]},
        "toys": {"description": "Toy sounds. Playful, childlike.", "category": "sfx", "tags": ["toys", "playful", "childlike"]},
        "trump": {"description": "Trump sounds. Trumpet-like.", "category": "melodic", "tags": ["trump", "trumpet-like"]},

        # U samples
        "ul": {"description": "UL samples. Various sounds.", "category": "misc", "tags": ["ul", "various"]},
        "ulgab": {"description": "UL gabber sounds. Hardcore.", "category": "electronic", "tags": ["ul", "gabber", "hardcore"]},
        "uxay": {"description": "Uxay samples. Experimental.", "category": "experimental", "tags": ["uxay", "experimental"]},

        # V samples
        "v": {"description": "V sample collection. Various sounds.", "category": "misc", "tags": ["v", "collection"]},
        "voodoo": {"description": "Voodoo sounds. Dark, mystical.", "category": "sfx", "tags": ["voodoo", "dark", "mystical"]},

        # W samples
        "wind": {"description": "Wind sounds. Atmospheric, nature.", "category": "sfx", "tags": ["wind", "atmospheric", "nature"]},
        "wobble": {"description": "Wobble bass. Dubstep wobble sound.", "category": "bass", "tags": ["wobble", "dubstep", "bass"]},
        "world": {"description": "World music samples. Global, ethnic.", "category": "world", "tags": ["world", "global", "ethnic"]},

        # X-Y samples
        "xmas": {"description": "Christmas sounds. Holiday, festive.", "category": "sfx", "tags": ["christmas", "holiday", "festive"]},
        "yeah": {"description": "Yeah vocal samples. Exclamation, hype.", "category": "vocal", "tags": ["yeah", "vocal", "exclamation", "hype"]},
    }

    # Add dirt samples to catalog
    for name, data in dirt_samples.items():
        sounds.append({
            "id": name,
            "name": name,
            "description": data["description"],
            "source": "dirt-samples",
            "category": data["category"],
            "tags": data["tags"],
            "example": f's("{name}")'
        })

    # ===========================================
    # BUILT-IN SYNTHS (always available)
    # ===========================================

    builtin_synths = {
        "sine": {
            "description": "Sine wave oscillator. Pure, smooth, fundamental tone. Sub bass, pure tones, gentle.",
            "category": "oscillator",
            "tags": ["sine", "oscillator", "pure", "smooth", "sub", "gentle", "fundamental"],
            "example": 'note("c4 e4 g4").s("sine")'
        },
        "saw": {
            "description": "Sawtooth wave oscillator. Bright, buzzy, rich harmonics. Classic synth lead, bass.",
            "category": "oscillator",
            "tags": ["sawtooth", "saw", "oscillator", "bright", "buzzy", "harmonics", "lead"],
            "example": 'note("c4 e4 g4").s("saw")'
        },
        "sawtooth": {
            "description": "Sawtooth wave oscillator. Alias for saw. Bright, buzzy, rich in harmonics.",
            "category": "oscillator",
            "tags": ["sawtooth", "saw", "oscillator", "bright", "buzzy", "harmonics"],
            "example": 'note("c4 e4 g4").s("sawtooth")'
        },
        "square": {
            "description": "Square wave oscillator. Hollow, woody, retro. Chiptune, 8-bit, video game.",
            "category": "oscillator",
            "tags": ["square", "oscillator", "hollow", "woody", "retro", "chiptune", "8-bit"],
            "example": 'note("c4 e4 g4").s("square")'
        },
        "triangle": {
            "description": "Triangle wave oscillator. Soft, mellow, between sine and square. Gentle leads.",
            "category": "oscillator",
            "tags": ["triangle", "oscillator", "soft", "mellow", "gentle"],
            "example": 'note("c4 e4 g4").s("triangle")'
        },
        "tri": {
            "description": "Triangle wave oscillator. Alias for triangle. Soft, mellow tone.",
            "category": "oscillator",
            "tags": ["triangle", "tri", "oscillator", "soft", "mellow"],
            "example": 'note("c4 e4 g4").s("tri")'
        },
    }

    # Add built-in synths to catalog
    for name, data in builtin_synths.items():
        sounds.append({
            "id": name,
            "name": name,
            "description": data["description"],
            "source": "builtin",
            "category": data["category"],
            "tags": data["tags"],
            "example": data["example"]
        })

    # ===========================================
    # TIDAL DRUM MACHINES (72 machines)
    # Use with .bank() function in Strudel
    # ===========================================

    drum_machines = {
        # A
        "AJKPercusyn": {"description": "AJK Percusyn drum synth. Analog percussion synthesizer. Unique electronic drums.", "tags": ["percusyn", "analog", "synth-drums", "electronic"]},
        "AkaiLinn": {"description": "Akai Linn MPC hybrid. Combines Akai sampling with Linn character. Hip-hop, R&B.", "tags": ["akai", "linn", "mpc", "hip-hop", "r&b", "sampling"]},
        "AkaiMPC60": {"description": "Akai MPC60 drum machine. Classic hip-hop sampler. Boom bap, golden era.", "tags": ["akai", "mpc60", "hip-hop", "boom-bap", "sampler", "classic"]},
        "AkaiXR10": {"description": "Akai XR10 drum machine. 90s Akai drums. Punchy electronic kit.", "tags": ["akai", "xr10", "90s", "electronic", "punchy"]},
        "AlesisHR16": {"description": "Alesis HR-16 drum machine. 80s/90s digital drums. Clean, punchy hits.", "tags": ["alesis", "hr16", "digital", "80s", "90s", "punchy"]},
        "AlesisSR16": {"description": "Alesis SR-16 drum machine. Popular 90s drums. Versatile, studio standard.", "tags": ["alesis", "sr16", "90s", "studio", "versatile"]},

        # B
        "BossDR110": {"description": "Boss DR-110 Dr. Rhythm. Compact analog drums. Lo-fi, characterful.", "tags": ["boss", "dr110", "analog", "lo-fi", "compact"]},
        "BossDR220": {"description": "Boss DR-220 Dr. Rhythm. 80s digital drums. Clean, versatile.", "tags": ["boss", "dr220", "digital", "80s", "clean"]},
        "BossDR55": {"description": "Boss DR-55 Dr. Rhythm. Early analog drum machine. Simple, punchy, classic.", "tags": ["boss", "dr55", "analog", "classic", "simple"]},
        "BossDR550": {"description": "Boss DR-550 Dr. Rhythm. 90s digital drums. Wide sound selection.", "tags": ["boss", "dr550", "digital", "90s", "versatile"]},
        "BossDR660": {"description": "Boss DR-660 Dr. Rhythm. Advanced 90s drums. High-quality samples.", "tags": ["boss", "dr660", "digital", "90s", "high-quality"]},

        # C
        "CasioRZ1": {"description": "Casio RZ-1 sampling drum machine. 80s sampler with built-in sounds. Quirky, nostalgic.", "tags": ["casio", "rz1", "sampler", "80s", "quirky"]},
        "CasioSK1": {"description": "Casio SK-1 sampling keyboard drums. Lo-fi, toy-like. Charming, nostalgic.", "tags": ["casio", "sk1", "lo-fi", "toy", "nostalgic"]},
        "CasioVL1": {"description": "Casio VL-1 VL-Tone drums. Iconic toy calculator synth drums. 8-bit, retro.", "tags": ["casio", "vl1", "toy", "8-bit", "retro", "calculator"]},

        # D
        "DoepferMS404": {"description": "Doepfer MS-404 modular drums. Analog modular synth drums. Experimental, raw.", "tags": ["doepfer", "ms404", "modular", "analog", "experimental"]},

        # E
        "EmuDrumulator": {"description": "E-mu Drumulator. Classic 80s digital drums. Electro, hip-hop essential.", "tags": ["emu", "drumulator", "80s", "electro", "hip-hop", "digital"]},
        "EmuModular": {"description": "E-mu Modular drum sounds. Modular synth drums. Experimental, unique.", "tags": ["emu", "modular", "synth", "experimental", "unique"]},
        "EmuSP12": {"description": "E-mu SP-12 sampler drums. Hip-hop classic. Boom bap, punchy, gritty.", "tags": ["emu", "sp12", "hip-hop", "boom-bap", "punchy", "sampler"]},

        # K
        "KorgDDM110": {"description": "Korg DDM-110 Super Drums. 80s digital drums. Punchy, characterful.", "tags": ["korg", "ddm110", "digital", "80s", "punchy"]},
        "KorgKPR77": {"description": "Korg KPR-77 drum machine. Analog drums, 80s character. Warm, punchy.", "tags": ["korg", "kpr77", "analog", "80s", "warm"]},
        "KorgKR55": {"description": "Korg KR-55 analog drums. Vintage rhythm machine. Warm, organic feel.", "tags": ["korg", "kr55", "analog", "vintage", "warm"]},
        "KorgKRZ": {"description": "Korg KRZ drum sounds. Korg rhythm sounds. Versatile, clean.", "tags": ["korg", "krz", "rhythm", "versatile"]},
        "KorgM1": {"description": "Korg M1 drum sounds. Iconic 80s workstation drums. Pop, dance, studio.", "tags": ["korg", "m1", "workstation", "80s", "pop", "dance"]},
        "KorgMinipops": {"description": "Korg Minipops rhythm machine. Vintage analog drums. Organ-combo style, retro.", "tags": ["korg", "minipops", "analog", "vintage", "retro"]},
        "KorgPoly800": {"description": "Korg Poly-800 drums. 80s polysynth drums. Digital, characterful.", "tags": ["korg", "poly800", "80s", "digital", "synth"]},
        "KorgT3": {"description": "Korg T3 workstation drums. 90s workstation sounds. Clean, professional.", "tags": ["korg", "t3", "workstation", "90s", "professional"]},

        # L
        "Linn9000": {"description": "Linn 9000 drum machine. Advanced Linn drums. Sampling, sequencing, 80s.", "tags": ["linn", "9000", "80s", "sampling", "sequencing"]},
        "LinnDrum": {"description": "LinnDrum classic. Iconic 80s digital drums. Pop, rock, hip-hop essential.", "tags": ["linndrum", "linn", "80s", "pop", "rock", "iconic"]},
        "LinnLM1": {"description": "Linn LM-1 first Linn drum machine. Revolutionary digital drums. Prince, 80s pop.", "tags": ["linn", "lm1", "80s", "pop", "revolutionary", "prince"]},
        "LinnLM2": {"description": "Linn LM-2 drum machine. Refined LM-1. 80s pop, rock drums.", "tags": ["linn", "lm2", "80s", "pop", "rock"]},

        # M
        "MFB512": {"description": "MFB-512 analog drum machine. German analog drums. Punchy, raw, electronic.", "tags": ["mfb", "512", "analog", "german", "electronic", "raw"]},
        "MPC1000": {"description": "Akai MPC1000 drums. 2000s MPC. Hip-hop, modern production.", "tags": ["akai", "mpc1000", "2000s", "hip-hop", "modern"]},
        "MoogConcertMateMG1": {"description": "Moog Concertmate MG-1 drums. Moog analog synth drums. Warm, characterful.", "tags": ["moog", "concertmate", "mg1", "analog", "warm"]},

        # O
        "OberheimDMX": {"description": "Oberheim DMX drum machine. 80s classic. Electro, hip-hop, new wave.", "tags": ["oberheim", "dmx", "80s", "electro", "hip-hop", "new-wave"]},

        # R
        "RhodesPolaris": {"description": "Rhodes Polaris drums. Rhodes synth drum sounds. Warm, analog character.", "tags": ["rhodes", "polaris", "synth", "analog", "warm"]},
        "RhythmAce": {"description": "Ace Tone Rhythm Ace. Vintage organ rhythm box. 60s/70s, retro, warm.", "tags": ["ace-tone", "rhythm-ace", "vintage", "60s", "70s", "organ"]},
        "RolandCompurhythm1000": {"description": "Roland CR-1000 Compurhythm. Advanced preset drums. Clean, versatile.", "tags": ["roland", "cr1000", "compurhythm", "preset", "clean"]},
        "RolandCompurhythm78": {"description": "Roland CR-78 Compurhythm. First programmable drum machine. Vintage, iconic.", "tags": ["roland", "cr78", "compurhythm", "vintage", "iconic", "programmable"]},
        "RolandCompurhythm8000": {"description": "Roland CR-8000 Compurhythm. Analog preset drums. Warm, classic.", "tags": ["roland", "cr8000", "compurhythm", "analog", "warm"]},
        "RolandD110": {"description": "Roland D-110 drum sounds. LA synthesis drums. 80s digital, clean.", "tags": ["roland", "d110", "la-synthesis", "80s", "digital"]},
        "RolandD70": {"description": "Roland D-70 drums. 90s workstation drums. Versatile, professional.", "tags": ["roland", "d70", "workstation", "90s", "professional"]},
        "RolandDDR30": {"description": "Roland DDR-30 drum machine. Digital drums. Clean, punchy.", "tags": ["roland", "ddr30", "digital", "punchy"]},
        "RolandJD990": {"description": "Roland JD-990 drums. High-end 90s synth drums. Lush, professional.", "tags": ["roland", "jd990", "90s", "synth", "professional"]},
        "RolandMC202": {"description": "Roland MC-202 drums. Micro Composer drums. Analog, TB-303 era.", "tags": ["roland", "mc202", "analog", "micro-composer"]},
        "RolandMC303": {"description": "Roland MC-303 Groovebox drums. 90s dance machine. House, techno.", "tags": ["roland", "mc303", "groovebox", "90s", "house", "techno"]},
        "RolandMT32": {"description": "Roland MT-32 drums. LA synthesis module drums. 80s game soundtracks.", "tags": ["roland", "mt32", "la-synthesis", "80s", "game"]},
        "RolandR8": {"description": "Roland R-8 Human Rhythm Composer. High-end 80s drums. Realistic, versatile.", "tags": ["roland", "r8", "80s", "realistic", "human-rhythm"]},
        "RolandS50": {"description": "Roland S-50 sampler drums. 80s sampler. Warm, vintage digital.", "tags": ["roland", "s50", "sampler", "80s", "warm"]},
        "RolandSH09": {"description": "Roland SH-09 synth drums. Analog monosynth drums. Raw, punchy.", "tags": ["roland", "sh09", "analog", "monosynth", "raw"]},
        "RolandSystem100": {"description": "Roland System-100 modular drums. Semi-modular analog. Raw, experimental.", "tags": ["roland", "system100", "modular", "analog", "experimental"]},
        "RolandTR505": {"description": "Roland TR-505 drum machine. Digital successor to 606. Clean, usable.", "tags": ["roland", "tr505", "digital", "clean"]},
        "RolandTR606": {"description": "Roland TR-606 Drumatix. Analog companion to TB-303. Acid house essential.", "tags": ["roland", "tr606", "analog", "acid", "house", "drumatix"]},
        "RolandTR626": {"description": "Roland TR-626 Rhythm Composer. Digital drums. Latin sounds, 80s.", "tags": ["roland", "tr626", "digital", "latin", "80s"]},
        "RolandTR707": {"description": "Roland TR-707 drum machine. Digital, clean 80s drums. Pop, dance.", "tags": ["roland", "tr707", "digital", "80s", "pop", "dance"]},
        "RolandTR727": {"description": "Roland TR-727 Latin percussion. Latin version of 707. Congas, bongos, timbales.", "tags": ["roland", "tr727", "latin", "percussion", "congas", "bongos"]},
        "RolandTR808": {"description": "Roland TR-808 Rhythm Composer. THE iconic drum machine. Hip-hop, electronic essential.", "tags": ["roland", "tr808", "808", "hip-hop", "electronic", "iconic", "classic"]},
        "RolandTR909": {"description": "Roland TR-909 Rhythm Composer. House and techno essential. Punchy, powerful.", "tags": ["roland", "tr909", "909", "house", "techno", "essential", "punchy"]},

        # S
        "SakataDPM48": {"description": "Sakata DPM-48 drums. Rare Japanese drums. Unique, characterful.", "tags": ["sakata", "dpm48", "japanese", "rare", "unique"]},
        "SequentialCircuitsDrumtracks": {"description": "Sequential Circuits Drumtracks. 80s digital drums. Clean, usable.", "tags": ["sequential", "drumtracks", "80s", "digital", "clean"]},
        "SequentialCircuitsTom": {"description": "Sequential Circuits TOM. Analog drum synth. Tunable, unique.", "tags": ["sequential", "tom", "analog", "drum-synth", "tunable"]},
        "SergeModular": {"description": "Serge Modular drums. Esoteric modular drums. Experimental, unique.", "tags": ["serge", "modular", "experimental", "unique", "esoteric"]},
        "SimmonsSDS400": {"description": "Simmons SDS-400 electronic drums. 80s electronic drums. Iconic hex pads.", "tags": ["simmons", "sds400", "electronic", "80s", "hex-pads"]},
        "SimmonsSDS5": {"description": "Simmons SDS-5 electronic drums. THE 80s electronic drum sound. Iconic.", "tags": ["simmons", "sds5", "electronic", "80s", "iconic"]},
        "SoundmastersR88": {"description": "Soundmaster SR-88 drums. Budget analog drums. Lo-fi, characterful.", "tags": ["soundmaster", "sr88", "analog", "lo-fi", "budget"]},

        # U-V
        "UnivoxMicroRhythmer12": {"description": "Univox Micro Rhythmer 12. Vintage preset drums. 70s, retro.", "tags": ["univox", "micro-rhythmer", "vintage", "70s", "preset"]},
        "ViscoSpaceDrum": {"description": "Visco Space Drum. Unique electronic drums. Spacey, experimental.", "tags": ["visco", "space-drum", "electronic", "spacey", "experimental"]},

        # X
        "XdrumLM8953": {"description": "X-drum LM-8953. Custom drum sounds. Electronic, unique.", "tags": ["xdrum", "lm8953", "electronic", "custom"]},

        # Y
        "YamahaRM50": {"description": "Yamaha RM50 drum module. 90s drum module. High-quality, versatile.", "tags": ["yamaha", "rm50", "90s", "module", "high-quality"]},
        "YamahaRX21": {"description": "Yamaha RX21 drum machine. Budget 80s drums. Digital, punchy.", "tags": ["yamaha", "rx21", "80s", "digital", "budget"]},
        "YamahaRX5": {"description": "Yamaha RX5 drum machine. Premium 80s drums. High-quality samples.", "tags": ["yamaha", "rx5", "80s", "digital", "premium"]},
        "YamahaRY30": {"description": "Yamaha RY30 drum machine. 90s AWM drums. Versatile, modern.", "tags": ["yamaha", "ry30", "90s", "awm", "versatile"]},
        "YamahaTG33": {"description": "Yamaha TG33 drums. Vector synthesis drums. Unique, evolving.", "tags": ["yamaha", "tg33", "vector", "synthesis", "unique"]},
    }

    # Standard kit sounds each drum machine supports
    kit_sounds = ["bd", "sd", "hh", "oh", "cp", "lt", "mt", "ht", "cy", "cb", "rs", "cr"]

    # Add drum machines to catalog (each machine as one entry with kit description)
    for machine_name, data in drum_machines.items():
        sounds.append({
            "id": machine_name.lower(),
            "name": machine_name,
            "description": data["description"] + f" Kit includes: {', '.join(kit_sounds)}.",
            "source": "drum-machines",
            "category": "drum_machine",
            "tags": data["tags"] + ["drum-machine", "kit"],
            "example": f's("bd sd hh hh").bank("{machine_name}")'
        })

    # ===========================================
    # VCSL (Versilian Community Sample Library)
    # High-quality acoustic samples, CC0 licensed
    # ===========================================

    vcsl_instruments = {
        # Percussion - Drums
        "ballwhistle": {"description": "Ball whistle percussion. Sports referee whistle. Shrill, attention-getting.", "category": "percussion", "tags": ["whistle", "ball", "sports", "sfx"]},
        "bassdrum1": {"description": "VCSL acoustic bass drum 1. Deep orchestral kick. Concert, classical.", "category": "percussion", "tags": ["bass-drum", "acoustic", "orchestral", "deep"]},
        "bassdrum2": {"description": "VCSL acoustic bass drum 2. Variant with different character. Orchestral.", "category": "percussion", "tags": ["bass-drum", "acoustic", "orchestral", "variant"]},
        "bongo": {"description": "VCSL bongo drums. Hand drums, Latin percussion. Warm, organic.", "category": "percussion", "tags": ["bongo", "hand-drum", "latin", "organic"]},
        "conga": {"description": "VCSL conga drums. Tall hand drums. Latin, Afro-Cuban, warm.", "category": "percussion", "tags": ["conga", "hand-drum", "latin", "afro-cuban"]},
        "darbuka": {"description": "VCSL darbuka. Middle Eastern goblet drum. Arabic, Turkish, belly dance.", "category": "percussion", "tags": ["darbuka", "middle-eastern", "goblet", "arabic"]},
        "framedrum": {"description": "VCSL frame drum. Large circular drum. World, shamanic, bodhran-like.", "category": "percussion", "tags": ["frame-drum", "world", "shamanic", "circular"]},

        # Percussion - Snares & Toms
        "snare_modern": {"description": "VCSL modern snare drum. Contemporary snare sound. Versatile, studio.", "category": "percussion", "tags": ["snare", "modern", "studio", "versatile"]},
        "snare_hi": {"description": "VCSL high-pitched snare. Bright, cutting snare. Piccolo-style.", "category": "percussion", "tags": ["snare", "high", "bright", "piccolo"]},
        "snare_low": {"description": "VCSL low snare drum. Deep snare sound. Fat, warm.", "category": "percussion", "tags": ["snare", "low", "deep", "warm"]},
        "snare_rim": {"description": "VCSL snare rim shot. Rim click/shot. Sharp, accented.", "category": "percussion", "tags": ["snare", "rim", "rimshot", "sharp"]},
        "tom_mallet": {"description": "VCSL tom with mallet. Soft attack tom. Orchestral, melodic.", "category": "percussion", "tags": ["tom", "mallet", "soft", "orchestral"]},
        "tom_stick": {"description": "VCSL tom with stick. Standard tom hit. Rock, pop drums.", "category": "percussion", "tags": ["tom", "stick", "rock", "pop"]},
        "tom_rim": {"description": "VCSL tom rim. Tom rim click. Accent, variation.", "category": "percussion", "tags": ["tom", "rim", "accent"]},
        "tom2_mallet": {"description": "VCSL tom 2 with mallet. Second tom, mallet hit.", "category": "percussion", "tags": ["tom", "mallet", "variant"]},
        "tom2_stick": {"description": "VCSL tom 2 with stick. Second tom, stick hit.", "category": "percussion", "tags": ["tom", "stick", "variant"]},
        "tom2_rim": {"description": "VCSL tom 2 rim. Second tom rim click.", "category": "percussion", "tags": ["tom", "rim", "variant"]},

        # Percussion - Timpani
        "timpani": {"description": "VCSL timpani. Orchestral kettle drums. Classical, dramatic.", "category": "percussion", "tags": ["timpani", "orchestral", "classical", "dramatic"]},
        "timpani_roll": {"description": "VCSL timpani roll. Sustained timpani tremolo. Building tension.", "category": "percussion", "tags": ["timpani", "roll", "tremolo", "tension"]},
        "timpani2": {"description": "VCSL timpani 2. Second timpani variant. Different tuning.", "category": "percussion", "tags": ["timpani", "variant", "orchestral"]},

        # Woodwinds - Recorders
        "recorder_alto_stacc": {"description": "VCSL alto recorder staccato. Short, detached notes. Renaissance.", "category": "woodwind", "tags": ["recorder", "alto", "staccato", "renaissance"]},
        "recorder_alto_vib": {"description": "VCSL alto recorder vibrato. Expressive with vibrato. Melodic.", "category": "woodwind", "tags": ["recorder", "alto", "vibrato", "expressive"]},
        "recorder_alto_sus": {"description": "VCSL alto recorder sustained. Long, held notes. Legato.", "category": "woodwind", "tags": ["recorder", "alto", "sustained", "legato"]},
        "recorder_bass_stacc": {"description": "VCSL bass recorder staccato. Low recorder, short notes.", "category": "woodwind", "tags": ["recorder", "bass", "staccato", "low"]},
        "recorder_bass_vib": {"description": "VCSL bass recorder vibrato. Low recorder with vibrato.", "category": "woodwind", "tags": ["recorder", "bass", "vibrato", "low"]},
        "recorder_bass_sus": {"description": "VCSL bass recorder sustained. Low recorder, long notes.", "category": "woodwind", "tags": ["recorder", "bass", "sustained", "low"]},
        "recorder_soprano_stacc": {"description": "VCSL soprano recorder staccato. High recorder, short.", "category": "woodwind", "tags": ["recorder", "soprano", "staccato", "high"]},
        "recorder_soprano_sus": {"description": "VCSL soprano recorder sustained. High recorder, long.", "category": "woodwind", "tags": ["recorder", "soprano", "sustained", "high"]},
        "recorder_tenor_stacc": {"description": "VCSL tenor recorder staccato. Mid-range recorder, short.", "category": "woodwind", "tags": ["recorder", "tenor", "staccato"]},
        "recorder_tenor_vib": {"description": "VCSL tenor recorder vibrato. Mid-range with vibrato.", "category": "woodwind", "tags": ["recorder", "tenor", "vibrato"]},
        "recorder_tenor_sus": {"description": "VCSL tenor recorder sustained. Mid-range, long notes.", "category": "woodwind", "tags": ["recorder", "tenor", "sustained"]},

        # Woodwinds - Ocarinas
        "ocarina_small_stacc": {"description": "VCSL small ocarina staccato. Small clay flute, short notes.", "category": "woodwind", "tags": ["ocarina", "small", "staccato", "clay"]},
        "ocarina_small": {"description": "VCSL small ocarina. High-pitched clay wind instrument.", "category": "woodwind", "tags": ["ocarina", "small", "high", "clay"]},
        "ocarina": {"description": "VCSL ocarina. Clay wind instrument. Zelda-like, pure, innocent.", "category": "woodwind", "tags": ["ocarina", "clay", "pure", "zelda"]},
        "ocarina_vib": {"description": "VCSL ocarina vibrato. Ocarina with expressive vibrato.", "category": "woodwind", "tags": ["ocarina", "vibrato", "expressive"]},

        # Woodwinds - Saxophones
        "saxello": {"description": "VCSL saxello. Rare curved soprano sax. Unique, jazz.", "category": "woodwind", "tags": ["saxello", "saxophone", "soprano", "jazz", "rare"]},
        "saxello_stacc": {"description": "VCSL saxello staccato. Short, punchy sax notes.", "category": "woodwind", "tags": ["saxello", "saxophone", "staccato"]},
        "saxello_vib": {"description": "VCSL saxello vibrato. Expressive saxello with vibrato.", "category": "woodwind", "tags": ["saxello", "saxophone", "vibrato"]},
        "sax": {"description": "VCSL tenor saxophone. Classic jazz/R&B sax. Rich, soulful.", "category": "woodwind", "tags": ["saxophone", "tenor", "jazz", "soulful"]},
        "sax_stacc": {"description": "VCSL tenor sax staccato. Short, punchy sax hits.", "category": "woodwind", "tags": ["saxophone", "tenor", "staccato"]},
        "sax_vib": {"description": "VCSL tenor sax vibrato. Expressive sax with vibrato.", "category": "woodwind", "tags": ["saxophone", "tenor", "vibrato"]},

        # Keyboards - Organs
        "pipeorgan_loud_pedal": {"description": "VCSL pipe organ loud pedal. Deep bass pedal, full power.", "category": "organ", "tags": ["organ", "pipe", "pedal", "loud", "bass"]},
        "pipeorgan_loud": {"description": "VCSL pipe organ loud. Full registration, powerful.", "category": "organ", "tags": ["organ", "pipe", "loud", "powerful"]},
        "pipeorgan_quiet_pedal": {"description": "VCSL pipe organ quiet pedal. Soft bass pedal.", "category": "organ", "tags": ["organ", "pipe", "pedal", "quiet", "soft"]},
        "pipeorgan_quiet": {"description": "VCSL pipe organ quiet. Soft registration, intimate.", "category": "organ", "tags": ["organ", "pipe", "quiet", "intimate"]},
        "organ_4inch": {"description": "VCSL 4-inch organ pipes. Small organ pipes, high.", "category": "organ", "tags": ["organ", "small", "high", "pipes"]},
        "organ_8inch": {"description": "VCSL 8-inch organ pipes. Standard organ pipes.", "category": "organ", "tags": ["organ", "standard", "pipes"]},
        "organ_full": {"description": "VCSL full organ. Complete organ registration. Rich, full.", "category": "organ", "tags": ["organ", "full", "rich", "complete"]},

        # Keyboards - Synths & Pianos
        "clavisynth": {"description": "VCSL clavisynth. Clavinet/synth hybrid. Funky, electronic.", "category": "keyboards", "tags": ["clavinet", "synth", "funky", "electronic"]},
        "fmpiano": {"description": "VCSL FM piano. DX7-style FM electric piano. 80s, digital, bright.", "category": "keyboards", "tags": ["piano", "fm", "dx7", "80s", "digital"]},
        "piano1": {"description": "VCSL piano 1. Acoustic grand piano. Classical, versatile.", "category": "keyboards", "tags": ["piano", "acoustic", "grand", "classical"]},
        "kawai": {"description": "VCSL Kawai piano. Kawai grand piano sample. Bright, clear.", "category": "keyboards", "tags": ["piano", "kawai", "grand", "bright"]},
        "steinway": {"description": "VCSL Steinway piano. Steinway grand piano. Rich, warm, concert.", "category": "keyboards", "tags": ["piano", "steinway", "grand", "concert", "rich"]},

        # Strings - Harps & Plucked
        "harp": {"description": "VCSL concert harp. Classical pedal harp. Ethereal, sweeping.", "category": "strings", "tags": ["harp", "concert", "classical", "ethereal"]},
        "folkharp": {"description": "VCSL folk harp. Celtic/lever harp. Folk, Celtic, intimate.", "category": "strings", "tags": ["harp", "folk", "celtic", "lever"]},
        "strumstick": {"description": "VCSL strumstick. Simple Appalachian string instrument. Folk, drone.", "category": "strings", "tags": ["strumstick", "appalachian", "folk", "drone"]},
        "psaltery_pluck": {"description": "VCSL psaltery plucked. Medieval plucked zither. Plucky, ancient.", "category": "strings", "tags": ["psaltery", "plucked", "medieval", "zither"]},
        "psaltery_spiccato": {"description": "VCSL psaltery spiccato. Short bowed psaltery notes.", "category": "strings", "tags": ["psaltery", "spiccato", "bowed", "short"]},
        "psaltery_bow": {"description": "VCSL bowed psaltery. Sustained bowed psaltery. Ethereal, haunting.", "category": "strings", "tags": ["psaltery", "bowed", "ethereal", "haunting"]},

        # World Strings
        "dantranh": {"description": "VCSL dan tranh. Vietnamese zither. Asian, traditional, delicate.", "category": "world", "tags": ["dan-tranh", "vietnamese", "zither", "asian"]},
        "dantranh_tremolo": {"description": "VCSL dan tranh tremolo. Tremolo technique on dan tranh.", "category": "world", "tags": ["dan-tranh", "tremolo", "vietnamese"]},
        "dantranh_vibrato": {"description": "VCSL dan tranh vibrato. Vibrato technique on dan tranh.", "category": "world", "tags": ["dan-tranh", "vibrato", "vietnamese"]},

        # Wind Instruments
        "harmonica": {"description": "VCSL harmonica. Blues harp. Expressive, folk, blues.", "category": "woodwind", "tags": ["harmonica", "blues", "harp", "folk"]},
        "harmonica_soft": {"description": "VCSL soft harmonica. Gentle harmonica playing.", "category": "woodwind", "tags": ["harmonica", "soft", "gentle"]},
        "harmonica_vib": {"description": "VCSL harmonica vibrato. Harmonica with vibrato.", "category": "woodwind", "tags": ["harmonica", "vibrato", "expressive"]},
        "super64": {"description": "VCSL Super 64 chromatic harmonica. Large chromatic harmonica.", "category": "woodwind", "tags": ["harmonica", "chromatic", "super64"]},
        "super64_acc": {"description": "VCSL Super 64 accented. Strong attack harmonica.", "category": "woodwind", "tags": ["harmonica", "chromatic", "accented"]},
        "super64_vib": {"description": "VCSL Super 64 vibrato. Chromatic harmonica with vibrato.", "category": "woodwind", "tags": ["harmonica", "chromatic", "vibrato"]},
        "didgeridoo": {"description": "VCSL didgeridoo. Australian Aboriginal drone instrument. Deep, drone, circular breathing.", "category": "world", "tags": ["didgeridoo", "australian", "drone", "aboriginal"]},

        # Mallet Percussion
        "agogo": {"description": "VCSL agogo bells. Brazilian percussion bells. Latin, samba, bright.", "category": "percussion", "tags": ["agogo", "bells", "brazilian", "samba"]},
        "anvil": {"description": "VCSL anvil. Metal anvil hit. Industrial, orchestral effect.", "category": "percussion", "tags": ["anvil", "metal", "industrial", "orchestral"]},
        "kalimba": {"description": "VCSL kalimba. African thumb piano. Plucky, gentle, melodic.", "category": "percussion", "tags": ["kalimba", "thumb-piano", "african", "melodic"]},
        "kalimba_pad": {"description": "VCSL kalimba pad. Sustained kalimba pad sound. Ambient, ethereal.", "category": "percussion", "tags": ["kalimba", "pad", "ambient", "ethereal"]},
        "marimba": {"description": "VCSL marimba. Large wooden mallet percussion. Warm, resonant.", "category": "percussion", "tags": ["marimba", "mallet", "wooden", "warm"]},
        "xylophone": {"description": "VCSL xylophone. Bright wooden mallet percussion. Crisp, piercing.", "category": "percussion", "tags": ["xylophone", "mallet", "bright", "crisp"]},
        "xylophone_hard": {"description": "VCSL xylophone hard mallets. Brighter, more attack.", "category": "percussion", "tags": ["xylophone", "hard", "bright", "attack"]},

        # Sound Effects
        "trainwhistle": {"description": "VCSL train whistle. Steam locomotive whistle. Nostalgic, effect.", "category": "sfx", "tags": ["train", "whistle", "steam", "nostalgic"]},
        "siren": {"description": "VCSL siren. Emergency siren sound. Alert, urgent.", "category": "sfx", "tags": ["siren", "emergency", "alert", "urgent"]},
        "wineglass": {"description": "VCSL wineglass. Singing glass rim. Ethereal, glass harmonica-like.", "category": "sfx", "tags": ["wineglass", "glass", "ethereal", "singing"]},
        "wineglass_slow": {"description": "VCSL wineglass slow. Slowly bowed wineglass. Sustained, haunting.", "category": "sfx", "tags": ["wineglass", "slow", "sustained", "haunting"]},
    }

    # Add VCSL instruments to catalog
    for name, data in vcsl_instruments.items():
        sounds.append({
            "id": f"vcsl_{name}",
            "name": name,
            "description": data["description"],
            "source": "vcsl",
            "category": data["category"],
            "tags": data["tags"] + ["vcsl", "acoustic", "sample-library"],
            "example": f'note("c4 e4 g4").s("{name}")'
        })

    # ===========================================
    # WAVETABLES (dough-waveforms and more)
    # Use with wt_ prefix for automatic looping
    # ===========================================

    wavetables = {
        # Numbered waveforms (basic synthesis textures)
        "wt_01": {"description": "Wavetable waveform 01. Basic synthesis texture. Evolving, complex.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis", "evolving"]},
        "wt_02": {"description": "Wavetable waveform 02. Basic synthesis texture variant 2.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_03": {"description": "Wavetable waveform 03. Basic synthesis texture variant 3.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_04": {"description": "Wavetable waveform 04. Basic synthesis texture variant 4.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_05": {"description": "Wavetable waveform 05. Basic synthesis texture variant 5.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_06": {"description": "Wavetable waveform 06. Basic synthesis texture variant 6.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_07": {"description": "Wavetable waveform 07. Basic synthesis texture variant 7.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_08": {"description": "Wavetable waveform 08. Basic synthesis texture variant 8.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_09": {"description": "Wavetable waveform 09. Basic synthesis texture variant 9.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_10": {"description": "Wavetable waveform 10. Basic synthesis texture variant 10.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_11": {"description": "Wavetable waveform 11. Basic synthesis texture variant 11.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_12": {"description": "Wavetable waveform 12. Basic synthesis texture variant 12.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_13": {"description": "Wavetable waveform 13. Basic synthesis texture variant 13.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_14": {"description": "Wavetable waveform 14. Basic synthesis texture variant 14.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_15": {"description": "Wavetable waveform 15. Basic synthesis texture variant 15.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_16": {"description": "Wavetable waveform 16. Basic synthesis texture variant 16.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_17": {"description": "Wavetable waveform 17. Basic synthesis texture variant 17.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_18": {"description": "Wavetable waveform 18. Basic synthesis texture variant 18.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_19": {"description": "Wavetable waveform 19. Basic synthesis texture variant 19.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},
        "wt_20": {"description": "Wavetable waveform 20. Basic synthesis texture variant 20.", "category": "wavetable", "tags": ["wavetable", "basic", "synthesis"]},

        # Acoustic instrument wavetables
        "wt_aguitar": {"description": "Wavetable acoustic guitar. Guitar harmonic content as wavetable. Organic, plucky.", "category": "wavetable", "tags": ["wavetable", "guitar", "acoustic", "organic"]},
        "wt_altosax": {"description": "Wavetable alto saxophone. Sax timbre as wavetable. Reedy, expressive.", "category": "wavetable", "tags": ["wavetable", "saxophone", "alto", "reedy"]},
        "wt_cello": {"description": "Wavetable cello. Cello harmonics as wavetable. Rich, bowed, strings.", "category": "wavetable", "tags": ["wavetable", "cello", "strings", "bowed"]},
        "wt_clarinett": {"description": "Wavetable clarinet. Clarinet timbre as wavetable. Woody, warm.", "category": "wavetable", "tags": ["wavetable", "clarinet", "woody", "warm"]},
        "wt_clavinet": {"description": "Wavetable clavinet. Funky clavinet as wavetable. Percussive, funky.", "category": "wavetable", "tags": ["wavetable", "clavinet", "funky", "percussive"]},
        "wt_dbass": {"description": "Wavetable double bass. Upright bass as wavetable. Deep, woody, organic.", "category": "wavetable", "tags": ["wavetable", "bass", "double-bass", "woody"]},
        "wt_ebass": {"description": "Wavetable electric bass. Electric bass as wavetable. Punchy, round.", "category": "wavetable", "tags": ["wavetable", "bass", "electric", "punchy"]},
        "wt_eguitar": {"description": "Wavetable electric guitar. Electric guitar as wavetable. Versatile, harmonic.", "category": "wavetable", "tags": ["wavetable", "guitar", "electric", "harmonic"]},
        "wt_eorgan": {"description": "Wavetable electric organ. Organ drawbars as wavetable. Classic, keys.", "category": "wavetable", "tags": ["wavetable", "organ", "electric", "drawbar"]},
        "wt_epiano": {"description": "Wavetable electric piano. Rhodes-style as wavetable. Warm, bell-like.", "category": "wavetable", "tags": ["wavetable", "piano", "electric", "rhodes"]},
        "wt_flute": {"description": "Wavetable flute. Flute timbre as wavetable. Airy, breathy.", "category": "wavetable", "tags": ["wavetable", "flute", "airy", "breathy"]},
        "wt_oboe": {"description": "Wavetable oboe. Oboe as wavetable. Nasal, expressive, reedy.", "category": "wavetable", "tags": ["wavetable", "oboe", "nasal", "reedy"]},
        "wt_piano": {"description": "Wavetable piano. Piano harmonics as wavetable. Bright, rich.", "category": "wavetable", "tags": ["wavetable", "piano", "acoustic", "rich"]},
        "wt_theremin": {"description": "Wavetable theremin. Theremin-style wavetable. Eerie, vocal-like, sci-fi.", "category": "wavetable", "tags": ["wavetable", "theremin", "eerie", "sci-fi"]},
        "wt_violin": {"description": "Wavetable violin. Violin as wavetable. Expressive, bowed, strings.", "category": "wavetable", "tags": ["wavetable", "violin", "strings", "bowed"]},

        # Synthesis & Effects wavetables
        "wt_fmsynth": {"description": "Wavetable FM synthesis. FM synth textures. Digital, bell-like, metallic.", "category": "wavetable", "tags": ["wavetable", "fm", "digital", "metallic"]},
        "wt_distorted": {"description": "Wavetable distorted. Heavy distortion wavetable. Aggressive, saturated.", "category": "wavetable", "tags": ["wavetable", "distortion", "aggressive", "saturated"]},
        "wt_granular": {"description": "Wavetable granular. Granular synthesis texture. Textural, fragmented.", "category": "wavetable", "tags": ["wavetable", "granular", "textural", "fragmented"]},

        # Special waveforms
        "wt_birds": {"description": "Wavetable birds. Bird-like textures. Nature, chirping, organic.", "category": "wavetable", "tags": ["wavetable", "birds", "nature", "organic"]},
        "wt_bitreduced": {"description": "Wavetable bit-reduced. Lo-fi, crushed. 8-bit, retro, crunchy.", "category": "wavetable", "tags": ["wavetable", "bitcrush", "lo-fi", "8-bit"]},
        "wt_hdrawn": {"description": "Wavetable hand-drawn. Custom drawn waveforms. Unique, experimental.", "category": "wavetable", "tags": ["wavetable", "hand-drawn", "custom", "experimental"]},
        "wt_hvoice": {"description": "Wavetable harmonic voice. Vocal harmonics. Choir-like, ethereal.", "category": "wavetable", "tags": ["wavetable", "voice", "harmonic", "ethereal"]},
        "wt_linear": {"description": "Wavetable linear. Linear waveform morphing. Smooth, evolving.", "category": "wavetable", "tags": ["wavetable", "linear", "smooth", "morphing"]},
        "wt_oscchip": {"description": "Wavetable oscillator chip. Chip-style waveforms. 8-bit, chiptune, retro.", "category": "wavetable", "tags": ["wavetable", "chip", "8-bit", "chiptune"]},
        "wt_overtone": {"description": "Wavetable overtone. Rich overtone content. Harmonic, complex.", "category": "wavetable", "tags": ["wavetable", "overtone", "harmonic", "complex"]},
        "wt_pluckalgo": {"description": "Wavetable pluck algorithm. Karplus-Strong style. Plucky, string-like.", "category": "wavetable", "tags": ["wavetable", "pluck", "karplus-strong", "string"]},
        "wt_raw": {"description": "Wavetable raw. Unprocessed raw waveforms. Pure, fundamental.", "category": "wavetable", "tags": ["wavetable", "raw", "pure", "unprocessed"]},
        "wt_sinharm": {"description": "Wavetable sine harmonic. Additive sine harmonics. Clean, pure, harmonic.", "category": "wavetable", "tags": ["wavetable", "sine", "harmonic", "additive"]},
        "wt_snippets": {"description": "Wavetable snippets. Short audio snippets as wavetable. Glitchy, textural.", "category": "wavetable", "tags": ["wavetable", "snippets", "glitch", "textural"]},
        "wt_stereo": {"description": "Wavetable stereo. Wide stereo wavetables. Spacious, wide.", "category": "wavetable", "tags": ["wavetable", "stereo", "wide", "spacious"]},
        "wt_stringbox": {"description": "Wavetable string box. String ensemble wavetable. Lush, ensemble.", "category": "wavetable", "tags": ["wavetable", "strings", "ensemble", "lush"]},
        "wt_symetric": {"description": "Wavetable symmetric. Symmetric waveforms. Balanced, clean.", "category": "wavetable", "tags": ["wavetable", "symmetric", "balanced", "clean"]},
        "wt_vgame": {"description": "Wavetable video game. Video game sound textures. Retro, game, 8-bit.", "category": "wavetable", "tags": ["wavetable", "video-game", "retro", "8-bit"]},
        "wt_vgamebasic": {"description": "Wavetable video game basic. Simple game waveforms. Chiptune, simple.", "category": "wavetable", "tags": ["wavetable", "video-game", "basic", "chiptune"]},
        "wt_c604": {"description": "Wavetable C604. C64-style chip waveforms. Commodore, SID, 8-bit.", "category": "wavetable", "tags": ["wavetable", "c64", "sid", "commodore"]},

        # Band-limited basics
        "wt_saw": {"description": "Wavetable sawtooth. Band-limited saw wave. Classic synth, aliasing-free.", "category": "wavetable", "tags": ["wavetable", "sawtooth", "band-limited", "classic"]},
        "wt_square": {"description": "Wavetable square. Band-limited square wave. Hollow, punchy.", "category": "wavetable", "tags": ["wavetable", "square", "band-limited", "hollow"]},
        "wt_triangle": {"description": "Wavetable triangle. Band-limited triangle wave. Soft, mellow.", "category": "wavetable", "tags": ["wavetable", "triangle", "band-limited", "mellow"]},
        "wt_sine": {"description": "Wavetable sine. Pure sine as wavetable. Pure, fundamental, sub.", "category": "wavetable", "tags": ["wavetable", "sine", "pure", "fundamental"]},
    }

    # Add wavetables to catalog
    for name, data in wavetables.items():
        sounds.append({
            "id": name,
            "name": name,
            "description": data["description"],
            "source": "wavetables",
            "category": data["category"],
            "tags": data["tags"] + ["looping", "synthesis"],
            "example": f'note("c4 e4 g4").s("{name}").clip(2)'
        })

    return sounds


def main():
    """Generate and save the sound catalog."""
    print("Building sound catalog...")

    sounds = build_catalog()

    # Save as JSON
    output_path = Path(__file__).parent / "sound_catalog.json"
    with open(output_path, "w") as f:
        json.dump(sounds, f, indent=2)

    print(f"Generated catalog with {len(sounds)} sounds")
    print(f"Saved to: {output_path}")

    # Print summary by source
    sources = {}
    for sound in sounds:
        source = sound["source"]
        sources[source] = sources.get(source, 0) + 1

    print("\nBreakdown by source:")
    for source, count in sorted(sources.items()):
        print(f"  {source}: {count}")

    # Print summary by category
    categories = {}
    for sound in sounds:
        cat = sound["category"]
        categories[cat] = categories.get(cat, 0) + 1

    print("\nBreakdown by category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:15]:
        print(f"  {cat}: {count}")


if __name__ == "__main__":
    main()
