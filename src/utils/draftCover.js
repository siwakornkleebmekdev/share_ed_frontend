export const DRAFT_COVER_URL = '/draft-placeholder.png';

export async function getDefaultDraftCoverFile() {
  const response = await fetch(DRAFT_COVER_URL);
  if (!response.ok) {
    throw new Error('Unable to load the default draft cover');
  }

  const blob = await response.blob();
  return new File([blob], 'draft-placeholder.png', {
    type: blob.type || 'image/png',
  });
}
