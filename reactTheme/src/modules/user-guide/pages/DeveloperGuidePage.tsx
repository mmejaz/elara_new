import GuideReader from '../components/GuideReader'
import { developerGuide } from '../docs'

/** Developer guide: architecture, stack, patterns, API and internals. */
function DeveloperGuidePage() {
  return (
    <GuideReader
      guide={developerGuide}
      title="Developer Guide"
      subtitle="Technical documentation — architecture, stack, design patterns, request cycle and more."
    />
  )
}

export default DeveloperGuidePage
