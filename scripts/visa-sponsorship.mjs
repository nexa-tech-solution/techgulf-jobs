// A wrong "Visa sponsored" badge misleads job seekers, so only a sentence that clearly offers it counts.
const OFFER = [
  /\bvisa sponsorship\b.{0,40}\b(available|provided|offered|included)\b/i,
  /\b(offer|offers|offering|provide|provides|providing|include|includes|including)\b.{0,40}\bvisa( sponsorship)?\b/i,
  /\b(we|company|employer)\b.{0,30}\bsponsors?\b.{0,30}\bvisas?\b/i,
  /\b(work|employment|residence)? ?visa\b.{0,20}\b(is |will be |are )?(provided|sponsored|covered|arranged)\b(?=\s*($|[.,;)]|by\b|for\b))/i,
  /\bsponsorship\b.{0,20}\bfor\b.{0,20}\b(work|employment)? ?visa\b/i,
];
const REFUSAL = /\b(visa card|no|not|non|unable|cannot|without|never|neither|nor|won't|must already|must have|must hold|own visa|valid visa|existing visa|require[sd]? sponsorship|need[s]? sponsorship|authori[sz]ed to work|right to work)\b|n't\b/i;

/** The sentence offering visa sponsorship, or undefined when the posting does not clearly offer it. */
export function visaOffer(text = "") {
  return text.split(/(?<=[.!?;])\s+|\n+/).find((s) => OFFER.some((re) => re.test(s)) && !REFUSAL.test(s));
}
