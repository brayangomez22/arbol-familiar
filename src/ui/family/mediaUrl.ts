/** Photos and voice notes live in public/media/people/, referenced from family.json by relative path. */
export function mediaUrl(src: string): string {
  return `${import.meta.env.BASE_URL}media/people/${src}`;
}
