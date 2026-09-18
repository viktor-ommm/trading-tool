import { ToolPage } from '../../ui/ToolPage'
import { meta } from './meta'

export default function RiskReward() {
  return (
    <ToolPage title={meta.title} summary={meta.summary}>
      <div className="placeholder">
        <p>
          This tool is not built yet. It is here to keep the registry honest: adding a tool means
          adding a folder under <code>src/tools/</code> and one entry in{' '}
          <code>src/tools/registry.ts</code>.
        </p>
        <p>Planned outputs: R-multiple, break-even win rate, expectancy per trade.</p>
      </div>
    </ToolPage>
  )
}
