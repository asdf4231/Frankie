let dirty = false

/** Cheap, non-reactive draft state for beforeunload and sign-out confirmation. */
export const isComposerDirty = () => dirty
export const setComposerDirty = (value: boolean) => { dirty = value }
