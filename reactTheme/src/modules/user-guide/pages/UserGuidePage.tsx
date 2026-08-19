import GuideReader from '../components/GuideReader'
import { userGuide } from '../docs'

/** End-user guide: what each part of the app does and how to use it. */
function UserGuidePage() {
  return (
    <GuideReader
      guide={userGuide}
      title="User Guide"
      subtitle="How to use the application — every module, feature and workflow explained."
    />
  )
}

export default UserGuidePage
