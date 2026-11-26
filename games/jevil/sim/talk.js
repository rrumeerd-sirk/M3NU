

const TALK = {
  0: 'CHAOS, CHAOS,&&CATCH ME&IF YOU CAN!',
  1: 'SHALL WE&PLAY THE&RING-AROUND?',
  2: 'MY HEARTS GO&OUT TO ALL&YOU SINNERS!',
  3: "HA, HA, LET'S&MAKE THE&DEVILSKNIFE.",
  5: "PIIP PIIP,&LET'S RIDE THE&CAROUSEL GAME.",
  6: 'HEE HEE,&HAVING FUN!?&JOIN THE&CLUB!',
  7: 'HEARTS,&DIAMONDS,&I CAN DO&ANYTHING!',
  8: 'WHO KEEPS&SPINNING THE&WORLD&AROUND?',
  10: 'YOU KIDS ARE&REALLY&KEEPING UP!',
  11: 'NU-HA!!&I NEVER HAD&SUCH FUN,&FUN!!',
  12: 'A BEAUTY IS&JOYING IN&MY HEART!',
  13: 'EVEN&DEVILSKNIFE&IS SMILING!',
  15: "IT'S SO&EXCITING...&I CAN'T&TAKE IT!!!",
  16: 'THIS IS IT,&BOISENGIRLS!&SEE YA!',
  17: 'ENOUGH!!&YOU KIDS&TIRED ME UP!',
  18: "KIDDING!!&HERE'S MY&FINAL CHAOS!",
};

const HOLD = {
  0: ['A CHAOS,&CHAOS!', "PLEASE, IT'S&JUST A&SIMPLE&CHAOS."],
  1: ['I CAN DO&ANYTHING!!'],
  2: ['THIS BODY&CANNOT BE&KILLED!', 'THESE&CURTAINS&ARE REALLY&ON FIRE!'],
  3: ["IT'S ALL&TOO MUCH&FUN!!!"],
};

export function talkText(line) {
  if (!line) return '';
  if (line.rr >= 0) {
    const opts = HOLD[line.rr];
    return opts[line.alt ?? 0] ?? opts[0];
  }
  return TALK[line.jturn] ?? '';
}

export const BATTLEMSG_START = '* LET THE GAMES BEGIN!';
const FLAVOR = [
  '* The world is spinning, spinning.',
  '* The air crackles with freedom.',
  '* JEVIL is laughing incomprehensibly.',
  '* It feels like a whirlwind.',
  '* Smells like chaos.',
];

export function flavorText(f) {
  let s = FLAVOR[f.rr];
  if (f.dancelv === 2) s = '* JEVIL seems exhausted...?';
  if (f.jturn === 16) s = '* CHAOS BOMB was prepared FOR YOU.';
  if (f.jturn === 18) s = '* Something terrible is coming...!';
  if (f.jturn >= 19) s = "* JEVIL's pulling out all the stops!";
  if (f.tired) s = '* JEVIL is truly exhausted!';
  return s;
}
