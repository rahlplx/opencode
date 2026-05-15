import { Component, Show } from "solid-js"

interface EChartsRendererProps {
  content: string
  isComplete: boolean
}

export const EChartsRenderer: Component<EChartsRendererProps> = (props) => {
  return (
    <Show when={props.content && props.isComplete}>
      <div data-component="echarts-renderer">
        <iframe
          data-slot="echarts-iframe"
          style={{
            width: "100%",
            height: "300px",
            border: "none",
            background: "transparent",
          }}
          sandbox="allow-scripts"
          srcdoc={`
            <!DOCTYPE html>
            <html>
            <head>
              <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
              <style>
                body { margin: 0; padding: 8px; background: transparent; }
                #chart { width: 100%; height: 280px; }
              </style>
            </head>
            <body>
              <div id="chart"></div>
              <script>
                try {
                  var opts = ${props.content || "{}"};
                  var chart = echarts.init(document.getElementById('chart'));
                  chart.setOption(opts);
                } catch(e) {
                  document.body.innerHTML = '<div style="color:red;padding:8px">ECharts error: ' + e.message + '<\/div>';
                }
              <\/script>
            </body>
            </html>
          `}
        />
      </div>
    </Show>
  )
}
