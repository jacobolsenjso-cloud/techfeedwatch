// Sammenligner videoens længde med artiklens læsetid.
//
// Det er sitets eneste egne tal der findes på HVER side, og det er præcis det
// løfte forsiden giver. Men formuleringen skal være omhyggelig:
//
//  - 16 af artiklerne har en video der er KORTERE end læsetiden. Der findes
//    ingen besparelse at påstå, og så vises linjen ikke.
//  - Det højeste forhold i arkivet er 168x — en timelang gennemgang til en kort
//    artikel. "Sparet otte timer" ville være løgn: man får ikke et kursus på
//    tre minutter. Derfor siger linjen at man kan BESLUTTE sig på tre minutter,
//    ikke at man har fået det samme.

/** "47:30" -> 2850. "1:02:59" -> 3779. Ugyldigt input -> null. */
export function durationToSeconds(duration) {
  if (!duration) return null;
  const parts = String(duration).trim().split(':').map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** 190 timer -> "190 hours". Under 2 timer -> minutter. */
export function formatSpan(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 120) return `${Math.round(minutes)} minutes`;
  const hours = Math.round(minutes / 60);
  return `${hours.toLocaleString('en-US')} hours`;
}

/**
 * @returns null hvis der ikke er noget ærligt at sige — ellers tallene til linjen.
 */
export function compareTimes(duration, minutesRead) {
  const seconds = durationToSeconds(duration);
  const read = Number(minutesRead);
  if (!seconds || !Number.isFinite(read) || read <= 0) return null;

  const videoMinutes = Math.round(seconds / 60);
  // Under to minutters forskel er der ingen pointe. Og er videoen kortere,
  // er der intet at spare — så siger vi ingenting frem for noget forkert.
  if (videoMinutes - read < 2) return null;

  return { videoMinutes, readMinutes: read, saved: videoMinutes - read };
}
