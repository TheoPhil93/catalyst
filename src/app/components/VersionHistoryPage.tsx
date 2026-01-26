import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { GitCommit, User } from "lucide-react";

// --- Custom Timeline Node ---
const TimelineNode = ({ data }: NodeProps) => {
  return (
    <div className="relative group">
      {/* Date Label (Left) */}
      <div className="absolute -left-32 top-3 w-28 text-right text-xs text-muted-foreground font-mono">
        {data.date}
      </div>

      {/* Node Content */}
      <div
        className={[
          "w-[340px] bg-card rounded-lg border border-border p-4 transition-all duration-200 relative",
          data.active
            ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg"
            : "hover:shadow-md hover:border-border",
        ].join(" ")}
      >
        {data.active && (
          <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Active Head
          </div>
        )}

        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">{data.version}</span>
              <Badge
                variant="secondary"
                className="text-[10px] h-5 border border-border bg-muted text-muted-foreground"
              >
                {data.org}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <User className="h-3 w-3" /> {data.author}
            </div>
          </div>

          {data.status === "rejected" && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Rejected
            </Badge>
          )}
        </div>

        <div className="bg-muted/20 rounded border border-border p-2 text-xs text-foreground/80 font-mono mt-3">
          <GitCommit className="h-3 w-3 inline mr-1 text-muted-foreground" />
          {data.message}
        </div>

        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="outline" className="h-7 text-xs w-full">
            Diff
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs w-full">
            Metadata
          </Button>
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-border !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-border !w-2 !h-2" />
    </div>
  );
};

const nodeTypes = { timelineNode: TimelineNode };

const initialNodes: Node[] = [
  {
    id: "1",
    type: "timelineNode",
    position: { x: 0, y: 0 },
    data: {
      version: "FDK 13.1.2",
      org: "SBB",
      active: true,
      date: "Jan 21, 2024",
      author: "Hans Müller",
      message: "Merge: Signal attributes update",
    },
  },
  {
    id: "2",
    type: "timelineNode",
    position: { x: 0, y: 200 },
    data: {
      version: "FDK 13.1.1",
      org: "SBB",
      active: false,
      date: "Jan 15, 2024",
      author: "Anna Schmidt",
      message: "Fix: Typo in Fahrbahn definition",
    },
  },
  {
    id: "3",
    type: "timelineNode",
    position: { x: 0, y: 400 },
    data: {
      version: "FDK 13.1.0",
      org: "SBB",
      active: false,
      date: "Jan 10, 2024",
      author: "System",
      message: "Release: Major version bump",
    },
  },
  // Branching node
  {
    id: "4",
    type: "timelineNode",
    position: { x: 400, y: 200 },
    data: {
      version: "FDK 13.1.1-dev",
      org: "SBB-Lab",
      active: false,
      status: "rejected",
      date: "Jan 14, 2024",
      author: "Peter Weber",
      message: "Exp: New geometry test",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
    style: { stroke: "var(--border)", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    type: "smoothstep",
    style: { stroke: "var(--border)", strokeWidth: 2 },
  },
  {
    id: "e4-3",
    source: "4",
    target: "3",
    type: "smoothstep",
    animated: true,
    style: { stroke: "var(--destructive)", strokeDasharray: "5,5" },
  },
];

export function VersionHistoryPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-16 px-8 bg-card border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Version Lineage</h2>
          <p className="text-xs text-muted-foreground">
            Chronological graph of all catalog mutations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export History
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-background relative overflow-hidden">
        {/* Subtle grid using theme border token */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          className="bg-transparent"
        >
          <Background color="transparent" />
          <Controls className="!bg-card !border-border !shadow-sm !rounded-lg" />
        </ReactFlow>
      </div>
    </div>
  );
}
