import { useMemo } from 'react'
import { renderToString } from 'katex'
import 'katex/dist/katex.min.css'

export default function LabMath({ tex }: { tex: string }) {
  const html = useMemo(() => renderToString(tex), [tex])
  return <span className="lab-math" dangerouslySetInnerHTML={{ __html: html }} />
}
