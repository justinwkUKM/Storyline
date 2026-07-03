import React, { useEffect, useRef, useState } from 'react';
import { PresentationData, ThemeName, CustomizationSettings, SlideContent, SlideGraphic, InteractiveQuiz, InteractiveLink } from '../types';
import {
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  HelpCircle, 
  Video, 
  Link as LinkIcon, 
  FileText, 
  LayoutGrid, 
  TrendingUp, 
  Award, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Sliders,
  Type as FontIcon,
  Palette,
  Eye,
  PlusCircle,
  X,
  ListPlus,
  Search,
  PanelsTopLeft,
  GalleryVerticalEnd,
  MessageSquareText,
  Link as LinkChain,
  Monitor,
  FileBadge2,
  Layers3,
  SquareDashedMousePointer,
  ClipboardList
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { HtmlBulletEditor } from './HtmlBulletEditor';
import { InteractiveGraphic } from './InteractiveGraphic';

interface SlideEditorProps {
  initialData: PresentationData;
  initialTheme?: ThemeName;
  initialCustomSettings?: CustomizationSettings;
  savedDeckId?: string | null;
  saveStatus?: string;
  onSave?: (data: PresentationData, theme: ThemeName, customSettings?: CustomizationSettings, saveAsNew?: boolean) => Promise<void>;
  onFinalise: (finalData: PresentationData, theme: ThemeName, customSettings?: CustomizationSettings) => void;
  onCancel: () => void;
}

const FONTS = [
  { id: 'font-sans', name: 'Inter (Sans)' },
  { id: 'font-mono', name: 'JetBrains Mono' },
  { id: 'font-serif', name: 'Lora (Editorial Serif)' },
  { id: 'font-display', name: 'Space Grotesk' }
];

const THEMES: { id: ThemeName; name: string; desc: string; colors: string }[] = [
  { id: 'limefrost', name: 'Lime Frost', desc: 'Fresh minty lime and dark green tones', colors: 'bg-lime-500 text-lime-900' },
  { id: 'modern', name: 'Modern Corporate', desc: 'Clean professional blue & slate theme', colors: 'bg-blue-600 text-slate-800' },
  { id: 'cosmic', name: 'Cosmic Slate', desc: 'Ambient futuristic dark mode styling', colors: 'bg-purple-600 text-slate-200 dark' },
  { id: 'minimal', name: 'High-Contrast Mono', desc: 'Swiss minimalist absolute dark & white', colors: 'bg-black text-black' },
  { id: 'custom', name: 'Custom Theme Builder', desc: 'Tailor colors, spacing, and layouts', colors: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' }
];

type GraphicType = 'process' | 'comparison' | 'metrics' | 'hierarchy' | 'pie';
type GraphicThumbnailVariant =
  | 'stats-hero'
  | 'stats-grid'
  | 'stats-scoreboard'
  | 'stats-trend'
  | 'stats-tiles'
  | 'stats-benchmark'
  | 'comparison-dual'
  | 'comparison-before-after'
  | 'comparison-pro-con'
  | 'comparison-bars'
  | 'comparison-tradeoff'
  | 'comparison-matrix'
  | 'comparison-quadrant'
  | 'comparison-heatmap'
  | 'process-timeline'
  | 'process-roadmap'
  | 'process-zigzag'
  | 'process-vertical'
  | 'process-pipeline'
  | 'process-swimlane'
  | 'hierarchy-org'
  | 'hierarchy-branch'
  | 'hierarchy-pyramid'
  | 'hierarchy-stack'
  | 'hierarchy-nested'
  | 'hierarchy-dependency'
  | 'pie-funnel'
  | 'pie-network'
  | 'pie-rings'
  | 'pie-donut'
  | 'pie-allocation'
  | 'pie-radial-bars'

interface GraphicPreset {
  id: GraphicType | 'none';
  name: string;
  desc: string;
  preview: SlideGraphic | null;
}

interface GraphicPresetGroup {
  label: string;
  presets: GraphicPreset[];
}

type InspectorTab = 'content' | 'visual' | 'interact' | 'theme';
type GraphicCategory = 'all' | 'stats' | 'comparison' | 'process' | 'hierarchy' | 'pie';

const GRAPHIC_PRESET_GROUPS: GraphicPresetGroup[] = [
  {
    label: 'Stats and KPI cards',
    presets: [
      {
        id: 'metrics',
        name: 'KPI Dashboard',
        desc: 'A hero metric with supporting cards for executive summaries.',
        preview: {
          type: 'metrics',
          title: 'Performance Snapshot',
          style: 'dashboard',
          elements: [
            { label: 'Reach', value: '92%', percentage: 92, secondaryText: 'Audience coverage', icon: 'TrendingUp' },
            { label: 'Adoption', value: '78%', percentage: 78, secondaryText: 'Feature uptake', icon: 'Zap' },
            { label: 'Velocity', value: '3.2x', percentage: 68, secondaryText: 'Faster delivery', icon: 'Award' }
          ]
        }
      },
      {
        id: 'metrics',
        name: 'Compact Stat Grid',
        desc: 'Dense four-card stats for quick scanning on small slides.',
        preview: {
          type: 'metrics',
          title: 'Compact Metrics',
          style: 'compact-grid',
          elements: [
            { label: 'Revenue', value: '$4.8M', percentage: 84, secondaryText: 'Quarter total', icon: 'BarChart3' },
            { label: 'Margin', value: '38%', percentage: 38, secondaryText: 'Gross margin', icon: 'Target' },
            { label: 'Pipeline', value: '124', percentage: 72, secondaryText: 'Active deals', icon: 'Rocket' },
            { label: 'CSAT', value: '4.9/5', percentage: 98, secondaryText: 'Customer rating', icon: 'Star' }
          ]
        }
      },
      {
        id: 'metrics',
        name: 'Executive Scoreboard',
        desc: 'A polished scorecard with a dominant top-line result.',
        preview: {
          type: 'metrics',
          title: 'Executive Scoreboard',
          style: 'scoreboard',
          elements: [
            { label: 'Net Growth', value: '+24%', percentage: 86, secondaryText: 'Strong momentum', icon: 'TrendingUp' },
            { label: 'Retention', value: '91%', percentage: 91, secondaryText: 'Stable base', icon: 'ShieldCheck' },
            { label: 'Velocity', value: '6.2d', percentage: 63, secondaryText: 'Cycle time', icon: 'Clock3' }
          ]
        }
      },
      {
        id: 'metrics',
        name: 'Trend Snapshot',
        desc: 'A directional summary with an obvious rising trend.',
        preview: {
          type: 'metrics',
          title: 'Trend Snapshot',
          style: 'trend-snapshot',
          elements: [
            { label: 'Growth', value: '+18%', percentage: 18, secondaryText: 'Steady uplift across the quarter', icon: 'ArrowUpRight' },
            { label: 'Demand', value: '144', percentage: 72, secondaryText: 'Qualified leads', icon: 'Activity' },
            { label: 'Conversion', value: '29%', percentage: 29, secondaryText: 'Pipeline conversion rate', icon: 'MoveUpRight' }
          ]
        }
      },
      {
        id: 'metrics',
        name: 'Metric Tiles',
        desc: 'Simple tiled stats for broad general presentations.',
        preview: {
          type: 'metrics',
          title: 'Metric Tiles',
          style: 'tile-grid',
          elements: [
            { label: 'Users', value: '18.2K', percentage: 82, secondaryText: 'Monthly active', icon: 'Users' },
            { label: 'Sessions', value: '61K', percentage: 76, secondaryText: 'Repeat usage', icon: 'Gauge' },
            { label: 'Satisfaction', value: '94%', percentage: 94, secondaryText: 'Post-launch score', icon: 'Smile' },
            { label: 'Uptime', value: '99.98%', percentage: 99, secondaryText: 'Platform reliability', icon: 'Server' }
          ]
        }
      },
      {
        id: 'metrics',
        name: 'Benchmark Panel',
        desc: 'A comparison-oriented stat card for target-versus-actual stories.',
        preview: {
          type: 'metrics',
          title: 'Benchmark Panel',
          style: 'benchmark',
          elements: [
            { label: 'Actual', value: '82', percentage: 82, secondaryText: 'Current delivery', icon: 'CheckCircle2' },
            { label: 'Target', value: '90', percentage: 90, secondaryText: 'Goal threshold', icon: 'Target' },
            { label: 'Gap', value: '8 pts', percentage: 8, secondaryText: 'Remaining lift', icon: 'Minus' }
          ]
        }
      }
    ]
  },
  {
    label: 'Comparisons and before/after views',
    presets: [
      {
        id: 'comparison',
        name: 'Side-by-Side Comparison',
        desc: 'Classic dual cards for direct tradeoffs.',
        preview: {
          type: 'comparison',
          title: 'Side-by-Side Comparison',
          style: 'vs-card',
          elements: [
            { label: 'Current state', value: '42%', percentage: 42, secondaryText: 'Manual workflow' },
            { label: 'Storyline', value: '88%', percentage: 88, secondaryText: 'Automated deck generation' }
          ]
        }
      },
      {
        id: 'comparison',
        name: 'Before/After Split',
        desc: 'A transformation view that makes progress obvious.',
        preview: {
          type: 'comparison',
          title: 'Before / After',
          style: 'before-after',
          elements: [
            { label: 'Before', value: 'Low clarity', percentage: 28, secondaryText: 'Dense, unstructured notes' },
            { label: 'After', value: 'Presentation-ready', percentage: 92, secondaryText: 'Clean, editable slide story' }
          ]
        }
      },
      {
        id: 'comparison',
        name: 'Pro/Con Balance',
        desc: 'Balanced pros and cons for decisions and recommendations.',
        preview: {
          type: 'comparison',
          title: 'Pro / Con Balance',
          style: 'pro-con',
          elements: [
            { label: 'Pros', value: '4', percentage: 74, secondaryText: 'Speed, consistency, exportability' },
            { label: 'Cons', value: '2', percentage: 26, secondaryText: 'Requires review and tuning' }
          ]
        }
      },
      {
        id: 'comparison',
        name: 'Benchmark Bars',
        desc: 'A bar-based comparison for competitive analysis.',
        preview: {
          type: 'comparison',
          title: 'Benchmark Bars',
          style: 'benchmark-bars',
          elements: [
            { label: 'Usability', value: '92', percentage: 92, secondaryText: 'Primary option' },
            { label: 'Cost', value: '68', percentage: 68, secondaryText: 'Lower is better' },
            { label: 'Speed', value: '88', percentage: 88, secondaryText: 'Time to value' }
          ]
        }
      },
      {
        id: 'comparison',
        name: 'Tradeoff Cards',
        desc: 'Three-way decisions with a clear winner highlight.',
        preview: {
          type: 'comparison',
          title: 'Tradeoff Cards',
          style: 'tradeoff-cards',
          elements: [
            { label: 'Option A', value: 'Fast', percentage: 54, secondaryText: 'Best for speed' },
            { label: 'Option B', value: 'Balanced', percentage: 72, secondaryText: 'Recommended default' },
            { label: 'Option C', value: 'Deep', percentage: 46, secondaryText: 'Most detailed approach' }
          ]
        }
      },
      {
        id: 'comparison',
        name: 'Feature Matrix',
        desc: 'A matrix-style comparison for capabilities or scenarios.',
        preview: {
          type: 'comparison',
          title: 'Feature Matrix',
          style: 'matrix',
          elements: [
            { label: 'Coverage', value: 'High', percentage: 86, secondaryText: 'Broad feature support' },
            { label: 'Flexibility', value: 'Medium', percentage: 64, secondaryText: 'Configurable behavior' },
            { label: 'Adoption', value: 'High', percentage: 88, secondaryText: 'Easy to use' },
            { label: 'Cost', value: 'Low', percentage: 34, secondaryText: 'Efficient to maintain' }
          ]
        }
      }
    ]
  },
  {
    label: 'Timelines, roadmaps, and process flows',
    presets: [
      {
        id: 'process',
        name: 'Timeline Flow',
        desc: 'A horizontal sequence for generic slide stories.',
        preview: {
          type: 'process',
          title: 'Timeline Flow',
          style: 'timeline',
          elements: [
            { label: 'Discover', value: '01', secondaryText: 'Read the source PDF', icon: 'BookOpen' },
            { label: 'Structure', value: '02', secondaryText: 'Build the deck outline', icon: 'LayoutGrid' },
            { label: 'Refine', value: '03', secondaryText: 'Edit the storyline', icon: 'Sliders' },
            { label: 'Present', value: '04', secondaryText: 'Play the final deck', icon: 'Presentation' }
          ]
        }
      },
      {
        id: 'process',
        name: 'Milestone Roadmap',
        desc: 'A roadmap treatment with clear delivery markers.',
        preview: {
          type: 'process',
          title: 'Milestone Roadmap',
          style: 'roadmap',
          elements: [
            { label: 'Q1', value: 'Plan', secondaryText: 'Set direction', icon: 'Compass' },
            { label: 'Q2', value: 'Build', secondaryText: 'Ship the core flow', icon: 'Hammer' },
            { label: 'Q3', value: 'Scale', secondaryText: 'Expand adoption', icon: 'Rocket' },
            { label: 'Q4', value: 'Optimize', secondaryText: 'Refine and automate', icon: 'Sparkles' }
          ]
        }
      },
      {
        id: 'process',
        name: 'Zigzag Sequence',
        desc: 'Alternating nodes for a more energetic narrative.',
        preview: {
          type: 'process',
          title: 'Zigzag Sequence',
          style: 'zigzag',
          elements: [
            { label: 'Input', value: '01', secondaryText: 'Source material' },
            { label: 'Shape', value: '02', secondaryText: 'Draft structure' },
            { label: 'Tune', value: '03', secondaryText: 'Refine visuals' },
            { label: 'Ship', value: '04', secondaryText: 'Deliver deck' }
          ]
        }
      },
      {
        id: 'process',
        name: 'Vertical Process Steps',
        desc: 'A stacked process for narrow columns and mobile-friendly slides.',
        preview: {
          type: 'process',
          title: 'Vertical Process',
          style: 'vertical-steps',
          elements: [
            { label: 'Collect', value: '01', secondaryText: 'Gather facts' },
            { label: 'Organize', value: '02', secondaryText: 'Group the story' },
            { label: 'Design', value: '03', secondaryText: 'Apply visual logic' },
            { label: 'Present', value: '04', secondaryText: 'Deliver with polish' }
          ]
        }
      },
      {
        id: 'process',
        name: 'Pipeline Stages',
        desc: 'A funnel-like workflow for lead or delivery stages.',
        preview: {
          type: 'process',
          title: 'Pipeline Stages',
          style: 'pipeline',
          elements: [
            { label: 'Intake', value: '14', secondaryText: 'Requests in', icon: 'Inbox' },
            { label: 'Draft', value: '09', secondaryText: 'Slides in progress', icon: 'FileText' },
            { label: 'Review', value: '05', secondaryText: 'Needs feedback', icon: 'MessageSquare' },
            { label: 'Ready', value: '03', secondaryText: 'Final deck queue', icon: 'CheckCircle2' }
          ]
        }
      },
      {
        id: 'process',
        name: 'Swimlane Flow',
        desc: 'Parallel lanes for teams, audiences, or work streams.',
        preview: {
          type: 'process',
          title: 'Swimlane Flow',
          style: 'swimlane',
          elements: [
            { label: 'Research', value: 'Lane 1', secondaryText: 'Source analysis' },
            { label: 'Writing', value: 'Lane 2', secondaryText: 'Draft generation' },
            { label: 'Review', value: 'Lane 3', secondaryText: 'Stakeholder edits' }
          ]
        }
      }
    ]
  },
  {
    label: 'Org charts, trees, pyramids, and layered hierarchy',
    presets: [
      {
        id: 'hierarchy',
        name: 'Org Chart',
        desc: 'A top-down structure for teams or reporting lines.',
        preview: {
          type: 'hierarchy',
          title: 'Org Chart',
          style: 'org-chart',
          elements: [
            { label: 'Leadership', value: 'CEO', secondaryText: 'Strategy and direction', icon: 'Crown' },
            { label: 'Product', value: 'VP', secondaryText: 'Build and ship', icon: 'Boxes' },
            { label: 'Operations', value: 'VP', secondaryText: 'Run the system', icon: 'Settings' },
            { label: 'Growth', value: 'VP', secondaryText: 'Reach and adoption', icon: 'TrendingUp' }
          ]
        }
      },
      {
        id: 'hierarchy',
        name: 'Branching Tree',
        desc: 'A branching diagram for categories, dependencies, or ownership.',
        preview: {
          type: 'hierarchy',
          title: 'Branching Tree',
          style: 'branch-tree',
          elements: [
            { label: 'Root', value: 'North Star', secondaryText: 'Primary objective', icon: 'Map' },
            { label: 'Branch A', value: 'Group 1', secondaryText: 'Audience segment' },
            { label: 'Branch B', value: 'Group 2', secondaryText: 'Delivery path' },
            { label: 'Branch C', value: 'Group 3', secondaryText: 'Support layer' }
          ]
        }
      },
      {
        id: 'hierarchy',
        name: 'Layered Pyramid',
        desc: 'A classic layered hierarchy for priorities and strategy.',
        preview: {
          type: 'hierarchy',
          title: 'Layered Pyramid',
          style: 'pyramid',
          elements: [
            { label: 'Vision', value: 'North Star', secondaryText: 'Top-level direction' },
            { label: 'Strategy', value: 'Plan', secondaryText: 'Key approach' },
            { label: 'Execution', value: 'Delivery', secondaryText: 'Core working layer' },
            { label: 'Detail', value: 'Tasks', secondaryText: 'Operational actions' }
          ]
        }
      },
      {
        id: 'hierarchy',
        name: 'Stack Architecture',
        desc: 'Layered blocks for systems, platforms, or content tiers.',
        preview: {
          type: 'hierarchy',
          title: 'Stack Architecture',
          style: 'architecture-stack',
          elements: [
            { label: 'Interface', value: 'Layer 1', secondaryText: 'User-facing layer' },
            { label: 'Logic', value: 'Layer 2', secondaryText: 'Rules and orchestration' },
            { label: 'Data', value: 'Layer 3', secondaryText: 'Persistence and sources' }
          ]
        }
      },
      {
        id: 'hierarchy',
        name: 'Nested Layers',
        desc: 'A compact nested layout for complex structures.',
        preview: {
          type: 'hierarchy',
          title: 'Nested Layers',
          style: 'nested-layers',
          elements: [
            { label: 'Top Layer', value: 'Level 1', secondaryText: 'Strategy layer' },
            { label: 'Mid Layer', value: 'Level 2', secondaryText: 'Platform layer' },
            { label: 'Base Layer', value: 'Level 3', secondaryText: 'Operational layer' }
          ]
        }
      },
      {
        id: 'hierarchy',
        name: 'Dependency Tree',
        desc: 'A dependency-oriented tree for tasks or systems.',
        preview: {
          type: 'hierarchy',
          title: 'Dependency Tree',
          style: 'dependency-tree',
          elements: [
            { label: 'Core', value: 'Base', secondaryText: 'Primary dependency', icon: 'Database' },
            { label: 'Module A', value: 'Built on Core', secondaryText: 'Feature layer' },
            { label: 'Module B', value: 'Built on Core', secondaryText: 'Presentation layer' },
            { label: 'Module C', value: 'Built on A + B', secondaryText: 'Composite output' }
          ]
        }
      }
    ]
  },
  {
    label: 'Funnels, matrices, quadrants, and radial layouts',
    presets: [
      {
        id: 'pie',
        name: 'Funnel Conversion',
        desc: 'A stage-by-stage funnel for conversion or prioritization.',
        preview: {
          type: 'pie',
          title: 'Funnel Conversion',
          style: 'funnel',
          elements: [
            { label: 'Awareness', value: '100%', percentage: 100, secondaryText: 'Top of funnel' },
            { label: 'Interest', value: '72%', percentage: 72, secondaryText: 'Qualified engagement' },
            { label: 'Decision', value: '48%', percentage: 48, secondaryText: 'Serious evaluation' },
            { label: 'Action', value: '27%', percentage: 27, secondaryText: 'Final conversion' }
          ]
        }
      },
      {
        id: 'pie',
        name: 'Circular Network',
        desc: 'Radial loops for ecosystems, communities, or feedback systems.',
        preview: {
          type: 'pie',
          title: 'Circular Network',
          style: 'circular-network',
          elements: [
            { label: 'Core', value: '100%', percentage: 100, secondaryText: 'Central hub' },
            { label: 'Partner', value: '68%', percentage: 68, secondaryText: 'Connected nodes' },
            { label: 'Audience', value: '54%', percentage: 54, secondaryText: 'Reach and adoption' }
          ]
        }
      },
      {
        id: 'comparison',
        name: 'Quadrant Matrix',
        desc: 'A two-by-two matrix for positioning and prioritization.',
        preview: {
          type: 'comparison',
          title: 'Quadrant Matrix',
          style: 'quadrant',
          elements: [
            { label: 'High Impact', value: 'Act Now', percentage: 86, secondaryText: 'Top priority' },
            { label: 'High Effort', value: 'Plan Carefully', percentage: 62, secondaryText: 'Needs coordination' },
            { label: 'Low Effort', value: 'Quick Wins', percentage: 78, secondaryText: 'Easy leverage' },
            { label: 'Low Impact', value: 'Defer', percentage: 24, secondaryText: 'Lower value' }
          ]
        }
      },
      {
        id: 'comparison',
        name: 'Heatmap Matrix',
        desc: 'A heatmap-style table for intensity or category coverage.',
        preview: {
          type: 'comparison',
          title: 'Heatmap Matrix',
          style: 'heatmap',
          elements: [
            { label: 'North', value: '91', percentage: 91, secondaryText: 'Strong signal' },
            { label: 'South', value: '63', percentage: 63, secondaryText: 'Moderate signal' },
            { label: 'East', value: '48', percentage: 48, secondaryText: 'Mixed signal' },
            { label: 'West', value: '77', percentage: 77, secondaryText: 'Strong signal' }
          ]
        }
      },
      {
        id: 'pie',
        name: 'Radial Rings',
        desc: 'Nested progress rings for modern status storytelling.',
        preview: {
          type: 'pie',
          title: 'Radial Rings',
          style: 'radial-rings',
          elements: [
            { label: 'Adoption', value: '88%', percentage: 88, secondaryText: 'Primary ring' },
            { label: 'Reach', value: '74%', percentage: 74, secondaryText: 'Secondary ring' },
            { label: 'Quality', value: '61%', percentage: 61, secondaryText: 'Tertiary ring' }
          ]
        }
      },
      {
        id: 'pie',
        name: 'Donut Allocation',
        desc: 'A clean split for budget, time, or ownership allocation.',
        preview: {
          type: 'pie',
          title: 'Donut Allocation',
          style: 'donut',
          elements: [
            { label: 'Research', value: '40%', percentage: 40, secondaryText: 'Source analysis' },
            { label: 'Writing', value: '35%', percentage: 35, secondaryText: 'AI draft shaping' },
            { label: 'Present', value: '25%', percentage: 25, secondaryText: 'Delivery polish' }
          ]
        }
      }
    ]
  }
];

const GRAPHIC_OPTIONS: GraphicPreset[] = [
  {
    id: 'none',
    name: 'Text Only',
    desc: 'Keep this slide focused on bullets and speaker notes.',
    preview: null
  },
  ...GRAPHIC_PRESET_GROUPS.flatMap((group) => group.presets)
];

const DEFAULT_GRAPHIC_STYLE_BY_TYPE: Record<GraphicType, string> = {
  process: 'timeline',
  comparison: 'vs-card',
  metrics: 'dashboard',
  hierarchy: 'org-chart',
  pie: 'donut'
};

const GRAPHIC_CATEGORY_ORDER: Array<{ id: GraphicCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'stats', label: 'Stats & KPIs' },
  { id: 'comparison', label: 'Comparisons' },
  { id: 'process', label: 'Timelines & Process' },
  { id: 'hierarchy', label: 'Hierarchy & Trees' },
  { id: 'pie', label: 'Funnels & Radial' }
];

const GRAPHIC_PRESET_CATEGORY: Record<string, GraphicCategory> = {
  'KPI Dashboard': 'stats',
  'Compact Stat Grid': 'stats',
  'Executive Scoreboard': 'stats',
  'Trend Snapshot': 'stats',
  'Metric Tiles': 'stats',
  'Benchmark Panel': 'stats',
  'Side-by-Side Comparison': 'comparison',
  'Before/After Split': 'comparison',
  'Pro/Con Balance': 'comparison',
  'Benchmark Bars': 'comparison',
  'Tradeoff Cards': 'comparison',
  'Feature Matrix': 'comparison',
  'Timeline Flow': 'process',
  'Milestone Roadmap': 'process',
  'Zigzag Sequence': 'process',
  'Vertical Process Steps': 'process',
  'Pipeline Stages': 'process',
  'Swimlane Flow': 'process',
  'Org Chart': 'hierarchy',
  'Branching Tree': 'hierarchy',
  'Layered Pyramid': 'hierarchy',
  'Stack Architecture': 'hierarchy',
  'Nested Layers': 'hierarchy',
  'Dependency Tree': 'hierarchy',
  'Funnel Conversion': 'pie',
  'Circular Network': 'pie',
  'Quadrant Matrix': 'pie',
  'Heatmap Matrix': 'pie',
  'Radial Rings': 'pie',
  'Donut Allocation': 'pie'
};

const GRAPHIC_PRESET_THUMBNAIL_VARIANT: Record<string, GraphicThumbnailVariant> = {
  'KPI Dashboard': 'stats-hero',
  'Compact Stat Grid': 'stats-grid',
  'Executive Scoreboard': 'stats-scoreboard',
  'Trend Snapshot': 'stats-trend',
  'Metric Tiles': 'stats-tiles',
  'Benchmark Panel': 'stats-benchmark',
  'Side-by-Side Comparison': 'comparison-dual',
  'Before/After Split': 'comparison-before-after',
  'Pro/Con Balance': 'comparison-pro-con',
  'Benchmark Bars': 'comparison-bars',
  'Tradeoff Cards': 'comparison-tradeoff',
  'Feature Matrix': 'comparison-matrix',
  'Timeline Flow': 'process-timeline',
  'Milestone Roadmap': 'process-roadmap',
  'Zigzag Sequence': 'process-zigzag',
  'Vertical Process Steps': 'process-vertical',
  'Pipeline Stages': 'process-pipeline',
  'Swimlane Flow': 'process-swimlane',
  'Org Chart': 'hierarchy-org',
  'Branching Tree': 'hierarchy-branch',
  'Layered Pyramid': 'hierarchy-pyramid',
  'Stack Architecture': 'hierarchy-stack',
  'Nested Layers': 'hierarchy-nested',
  'Dependency Tree': 'hierarchy-dependency',
  'Funnel Conversion': 'pie-funnel',
  'Circular Network': 'pie-network',
  'Quadrant Matrix': 'comparison-quadrant',
  'Heatmap Matrix': 'comparison-heatmap',
  'Radial Rings': 'pie-rings',
  'Donut Allocation': 'pie-allocation'
};

function cloneGraphic(graphic: SlideGraphic): SlideGraphic {
  return {
    ...graphic,
    elements: graphic.elements.map((el) => ({ ...el }))
  };
}

function createGraphicFromPreset(preset: GraphicPreset, existing?: SlideGraphic): SlideGraphic {
  if (!preset.preview) {
    return {
      type: 'metrics',
      title: existing?.title || 'Visual Graphic',
      elements: existing?.elements?.length
        ? existing.elements.map((el) => ({ ...el }))
        : [{ label: 'Key Point', value: '100%', secondaryText: 'Add supporting context', percentage: 100, icon: 'LayoutGrid' }]
    };
  }

  if (
    existing?.type === preset.preview.type &&
    (existing.style || DEFAULT_GRAPHIC_STYLE_BY_TYPE[existing.type]) === (preset.preview.style || DEFAULT_GRAPHIC_STYLE_BY_TYPE[preset.preview.type])
  ) {
    return cloneGraphic(existing);
  }

  return cloneGraphic({
    ...preset.preview,
    title: existing?.title || preset.preview.title
  });
}

function getSelectedGraphicPreset(graphic?: SlideGraphic) {
  if (!graphic) return GRAPHIC_OPTIONS[0];
  return (
    GRAPHIC_OPTIONS.find((option) => {
      if (!option.preview) return false;
      const graphicStyle = graphic.style || DEFAULT_GRAPHIC_STYLE_BY_TYPE[graphic.type];
      const presetStyle = option.preview.style || DEFAULT_GRAPHIC_STYLE_BY_TYPE[option.preview.type];
      return graphic.type === option.preview.type && graphicStyle === presetStyle;
    }) ||
    GRAPHIC_OPTIONS.find((option) => option.preview?.type === graphic.type) ||
    GRAPHIC_OPTIONS[0]
  );
}

export function SlideEditor({
  initialData,
  initialTheme = 'limefrost',
  initialCustomSettings,
  savedDeckId,
  saveStatus,
  onSave,
  onFinalise,
  onCancel
}: SlideEditorProps) {
  const [data, setData] = useState<PresentationData>({
    ...initialData,
    slides: [...initialData.slides]
  });

  const [theme, setTheme] = useState<ThemeName>(initialTheme);
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>(initialCustomSettings || {
    fontFamily: 'font-sans',
    primaryColor: '#a3e635',
    backgroundColor: '#f7fee7',
    textColor: '#1a2e05',
    spacing: 'normal',
    alignment: 'left'
  });

  const [copiedRawText, setCopiedRawText] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [showRawTextPanel, setShowRawTextPanel] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('content');
  const [graphicDrawerOpen, setGraphicDrawerOpen] = useState(false);
  const [graphicSearch, setGraphicSearch] = useState('');
  const [graphicCategory, setGraphicCategory] = useState<GraphicCategory>('all');
  const autoSaveTimerRef = useRef<number | null>(null);

  const activeSlide = data.slides[activeSlideIndex] || data.slides[0];

  const setActiveSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, data.slides.length - 1));
    setActiveSlideIndex(safeIndex);
  };

  const clearAutoSaveTimer = () => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  const scheduleAutoSave = (
    nextData: PresentationData,
    nextTheme: ThemeName,
    nextCustomSettings?: CustomizationSettings
  ) => {
    if (!onSave || !nextData.title.trim() || nextData.slides.length === 0) return;
    clearAutoSaveTimer();
    autoSaveTimerRef.current = window.setTimeout(() => {
      void onSave(nextData, nextTheme, nextTheme === 'custom' ? nextCustomSettings : undefined, false);
    }, 1200);
  };

  const commitDataChange = (updater: (current: PresentationData) => PresentationData) => {
    const nextData = updater(data);
    setData(nextData);
    scheduleAutoSave(nextData, theme, customSettings);
  };

  const commitThemeChange = (value: ThemeName) => {
    setTheme(value);
    scheduleAutoSave(data, value, customSettings);
  };

  const commitCustomSettingsChange = (updater: (current: CustomizationSettings) => CustomizationSettings) => {
    const nextSettings = updater(customSettings);
    setCustomSettings(nextSettings);
    scheduleAutoSave(data, theme, nextSettings);
  };

  const duplicateSlide = (index: number) => {
    const slide = data.slides[index];
    const clone: SlideContent = {
      ...slide,
      id: `slide-custom-${Date.now()}`,
      title: `${slide.title} Copy`,
      content: [...slide.content],
      speakerNotes: slide.speakerNotes,
      quiz: slide.quiz ? { ...slide.quiz, options: [...slide.quiz.options] } : undefined,
      links: slide.links ? slide.links.map((link) => ({ ...link })) : undefined,
      graphic: slide.graphic ? cloneGraphic(slide.graphic) : undefined
    };
    const updatedSlides = [...data.slides];
    updatedSlides.splice(index + 1, 0, clone);
    commitDataChange((current) => ({ ...current, slides: updatedSlides }));
    setActiveSlideIndex(index + 1);
  };

  // Copy raw parsed text helper
  const handleCopyRawText = () => {
    if (data.rawParsedText) {
      navigator.clipboard.writeText(data.rawParsedText);
      setCopiedRawText(true);
      setTimeout(() => setCopiedRawText(false), 2000);
    }
  };

  // Slide management functions
  const updateSlideField = (index: number, field: keyof SlideContent, value: any) => {
    const updatedSlides = [...data.slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      [field]: value
    };
    commitDataChange((current) => ({ ...current, slides: updatedSlides }));
  };

  const handleAddSlide = () => {
    const newSlide: SlideContent = {
      id: `slide-custom-${Date.now()}`,
      title: 'New Key Concept',
      content: ['Introduce a major point here', 'Support it with concise data and statistics'],
      speakerNotes: 'Brief notes guiding the presenter through this point.',
      graphic: {
        type: 'metrics',
        title: 'Core Stat Grid',
        elements: [
          { label: 'Key Performance', value: '100%', secondaryText: 'Operational accuracy', percentage: 100, icon: 'Target' }
        ]
      }
    };
    const updatedSlides = [...data.slides, newSlide];
    commitDataChange((current) => ({ ...current, slides: updatedSlides }));
    setActiveSlideIndex(updatedSlides.length - 1);
  };

  const handleRemoveSlide = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (data.slides.length <= 1) {
      alert("Your presentation must contain at least one slide.");
      return;
    }
    if (!window.confirm('Delete this slide?')) return;
    const updatedSlides = data.slides.filter((_, idx) => idx !== index);
    commitDataChange((current) => ({ ...current, slides: updatedSlides }));
    setActiveSlideIndex((current) => {
      if (current === index) return Math.max(0, index - 1);
      if (current > index) return current - 1;
      return current;
    });
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === data.slides.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updatedSlides = [...data.slides];
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[targetIdx];
    updatedSlides[targetIdx] = temp;

    commitDataChange((current) => ({ ...current, slides: updatedSlides }));
    if (activeSlideIndex === index) {
      setActiveSlideIndex(targetIdx);
    } else if (activeSlideIndex === targetIdx) {
      setActiveSlideIndex(index);
    }
  };

  // Slide content helpers
  const handleUpdateBullet = (slideIdx: number, bulletIdx: number, value: string) => {
    const slide = data.slides[slideIdx];
    const updatedBullets = [...slide.content];
    updatedBullets[bulletIdx] = value;
    updateSlideField(slideIdx, 'content', updatedBullets);
  };

  const handleAddBullet = (slideIdx: number) => {
    const slide = data.slides[slideIdx];
    const updatedBullets = [...slide.content, 'New bullet point details'];
    updateSlideField(slideIdx, 'content', updatedBullets);
  };

  const handleRemoveBullet = (slideIdx: number, bulletIdx: number) => {
    const slide = data.slides[slideIdx];
    if (slide.content.length <= 1) return;
    const updatedBullets = slide.content.filter((_, idx) => idx !== bulletIdx);
    updateSlideField(slideIdx, 'content', updatedBullets);
  };

  // Graphic element helpers
  const handleUpdateGraphicField = (slideIdx: number, field: keyof SlideGraphic, value: any) => {
    const slide = data.slides[slideIdx];
    if (!slide.graphic) return;
    const updatedGraphic = {
      ...slide.graphic,
      [field]: value
    };
    updateSlideField(slideIdx, 'graphic', updatedGraphic);
  };

  const handleUpdateGraphicElement = (slideIdx: number, elIdx: number, key: string, val: any) => {
    const slide = data.slides[slideIdx];
    if (!slide.graphic) return;
    const updatedElements = [...slide.graphic.elements];
    updatedElements[elIdx] = {
      ...updatedElements[elIdx],
      [key]: val
    };
    handleUpdateGraphicField(slideIdx, 'elements', updatedElements);
  };

  const handleAddGraphicElement = (slideIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.graphic) return;
    const newElement = { label: 'New Element', value: '50%', secondaryText: 'Supporting metric', percentage: 50, icon: 'Cpu' };
    const updatedElements = [...slide.graphic.elements, newElement];
    handleUpdateGraphicField(slideIdx, 'elements', updatedElements);
  };

  const openGraphicPreset = (preset: GraphicPreset) => {
    if (!activeSlide) return;
    if (preset.id === 'none') {
      updateSlideField(activeSlideIndex, 'graphic', undefined);
      return;
    }
    updateSlideField(activeSlideIndex, 'graphic', createGraphicFromPreset(preset, activeSlide || undefined));
    setInspectorTab('visual');
  };

  const filteredGraphicGroups = GRAPHIC_PRESET_GROUPS.map((group) => ({
    ...group,
    presets: group.presets.filter((preset) => {
      const matchesSearch =
        graphicSearch.trim() === '' ||
        preset.name.toLowerCase().includes(graphicSearch.toLowerCase()) ||
        preset.desc.toLowerCase().includes(graphicSearch.toLowerCase());
      const category = GRAPHIC_PRESET_CATEGORY[preset.name];
      const matchesCategory = graphicCategory === 'all' || graphicCategory === category;
      return matchesSearch && matchesCategory;
    })
  })).filter((group) => group.presets.length > 0);

  const renderGraphicThumbnail = (preset: GraphicPreset) => {
    if (preset.id === 'none' || !preset.preview) {
      return (
        <div className="h-20 rounded-2xl border border-dashed border-lime-200 bg-white/70 p-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-lime-100 w-3/4" />
            <div className="h-2 rounded-full bg-lime-100 w-1/2" />
          </div>
          <div className="h-2 rounded-full bg-lime-100 w-2/3" />
        </div>
      );
    }

    const { type, style = '', elements = [] } = preset.preview;
    const primary = elements[0];
    const secondary = elements[1];
    const tertiary = elements[2];
    const quaternary = elements[3];
    const variant = GRAPHIC_PRESET_THUMBNAIL_VARIANT[preset.name] || 'stats-hero';

    const frame = (children: React.ReactNode, className = '') => (
      <div className={cn("h-28 rounded-[22px] border border-lime-200 bg-white/90 p-3 shadow-sm overflow-hidden", className)}>
        {children}
      </div>
    );

    const smallMetric = (title: string, value: string, accent = 'bg-lime-500') => (
      <div className="rounded-2xl border border-lime-100 bg-white p-2.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{title}</span>
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", accent)} />
        </div>
        <div className="mt-1 text-sm font-black leading-none text-lime-950 truncate">{value}</div>
      </div>
    );

    const tinyBar = (height: number, className = 'bg-lime-500') => (
      <div className="flex-1 flex items-end">
        <div className={cn("w-full rounded-full", className)} style={{ height }} />
      </div>
    );

    switch (variant) {
      case 'stats-hero':
        return frame(
          <div className="flex h-full gap-2.5">
            <div className="flex-[1.15] rounded-[18px] bg-lime-50 p-3 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-700/70">Hero</div>
                  <div className="mt-1 text-[26px] font-black leading-none text-lime-950">{primary?.value || '92%'}</div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-white border border-lime-200 flex items-center justify-center text-lime-700 text-[10px] font-black">
                  {primary?.label?.slice(0, 2).toUpperCase() || 'KP'}
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">{primary?.label || 'Performance Snapshot'}</div>
              <div className="mt-2 h-1.5 rounded-full bg-lime-200 overflow-hidden">
                <div className="h-full w-[78%] rounded-full bg-lime-500" />
              </div>
            </div>
            <div className="flex-[0.85] grid grid-rows-2 gap-2">
              {elements.slice(1, 3).map((el, idx) => smallMetric(el.label, el.value || el.percentage?.toString() || '--', idx === 0 ? 'bg-lime-400' : 'bg-lime-300'))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'stats-grid':
        return frame(
          <div className="grid h-full grid-cols-2 gap-2">
            {elements.slice(0, 4).map((el, idx) => (
              <div key={idx} className={cn("rounded-[16px] p-2.5 border shadow-sm", idx === 0 ? "bg-lime-50 border-lime-100" : "bg-white border-lime-100")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{el.label}</span>
                  <span className={cn("h-2 w-2 rounded-full", idx % 2 === 0 ? "bg-lime-500" : "bg-emerald-400")} />
                </div>
                <div className="mt-2 text-lg font-black leading-none text-lime-950">{el.value || el.percentage?.toString() || '--'}</div>
                <div className="mt-2 h-1.5 rounded-full bg-lime-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", idx === 1 ? "w-[38%] bg-lime-400" : idx === 2 ? "w-[72%] bg-emerald-400" : idx === 3 ? "w-[90%] bg-lime-500" : "w-[84%] bg-lime-500")} />
                </div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'stats-scoreboard':
        return frame(
          <div className="grid h-full grid-cols-[1.12fr_0.88fr] gap-2.5">
            <div className="rounded-[18px] bg-lime-50 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65">Score</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-lime-800 border border-lime-100">Topline</span>
              </div>
              <div>
                <div className="text-[26px] font-black leading-none text-lime-950">{primary?.value || '+24%'}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">{primary?.label || 'Executive Scoreboard'}</div>
              </div>
              <div className="flex items-end gap-1 pt-2">
                {[14, 22, 18, 26, 20].map((h, idx) => (
                  <div key={idx} className="flex-1 rounded-t-lg bg-lime-200" style={{ height: `${h}px` }}>
                    <div className={cn("w-full rounded-t-lg", idx === 3 ? "bg-lime-500" : "bg-lime-400")} style={{ height: `${Math.max(6, h - 4)}px` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {elements.slice(1, 4).map((el, idx) => (
                <div key={idx} className="rounded-[16px] border border-lime-100 bg-white p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{el.label}</span>
                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full", idx === 0 ? "bg-lime-100 text-lime-800" : idx === 1 ? "bg-emerald-100 text-emerald-800" : "bg-lime-50 text-lime-800")}>
                      {el.percentage ?? el.value ?? '--'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-lime-100 overflow-hidden">
                    <div className={cn("h-full rounded-full", idx === 0 ? "w-[82%] bg-lime-500" : idx === 1 ? "w-[66%] bg-emerald-500" : "w-[48%] bg-lime-300")} />
                  </div>
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'stats-trend':
        return frame(
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-700/65">Trend</div>
                <div className="mt-1 text-sm font-black text-lime-950 truncate">{primary?.label || 'Trend Snapshot'}</div>
              </div>
              <div className="rounded-full bg-lime-50 px-2 py-1 text-[9px] font-black text-lime-800">{primary?.value || '+18%'}</div>
            </div>
            <div className="mt-2 flex-1 rounded-[18px] bg-white border border-lime-100 p-2.5 relative overflow-hidden">
              <div className="absolute inset-x-3 bottom-3 flex items-end gap-1">
                {[10, 16, 12, 22, 18, 26].map((h, idx) => (
                  <div key={idx} className="flex-1 rounded-t-lg bg-lime-100">
                    <div className={cn("rounded-t-lg", idx >= 3 ? "bg-lime-500" : "bg-lime-300")} style={{ height: `${h}px` }} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-x-3 top-1/2 h-px bg-lime-100" />
              <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-lime-50 border border-lime-100 flex items-center justify-center text-lime-700 text-[10px] font-black">↗</div>
            </div>
          </div>,
          'p-2.5'
        );

      case 'stats-tiles':
        return frame(
          <div className="grid h-full grid-cols-2 gap-2">
            {elements.slice(0, 4).map((el, idx) => (
              <div key={idx} className={cn("rounded-[16px] p-3 border shadow-sm", idx % 2 === 0 ? "bg-white border-lime-100" : "bg-lime-50 border-lime-100")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="h-8 w-8 rounded-2xl bg-lime-100 border border-lime-200 flex items-center justify-center text-[9px] font-black text-lime-800">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className={cn("h-2.5 w-2.5 rounded-full", idx === 0 ? "bg-lime-500" : idx === 1 ? "bg-emerald-500" : idx === 2 ? "bg-lime-400" : "bg-lime-300")} />
                </div>
                <div className="mt-2 text-lg font-black leading-none text-lime-950">{el.value || el.percentage?.toString() || '--'}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">{el.label}</div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'stats-benchmark':
        return frame(
          <div className="grid h-full grid-cols-[1fr_0.88fr] gap-2.5">
            <div className="rounded-[18px] bg-lime-50 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-700/65">Actual</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-lime-800 border border-lime-100">vs Target</span>
              </div>
              <div>
                <div className="text-[26px] font-black leading-none text-lime-950">{primary?.value || '82'}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">{primary?.label || 'Benchmark Panel'}</div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-lime-200 overflow-hidden relative">
                <div className="absolute left-[82%] top-[-2px] bottom-[-2px] w-px bg-lime-950/40" />
                <div className="h-full w-[82%] rounded-full bg-lime-500" />
              </div>
            </div>
            <div className="space-y-2">
              {elements.slice(1, 3).map((el, idx) => (
                <div key={idx} className="rounded-[16px] border border-lime-100 bg-white p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{el.label}</span>
                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full", idx === 0 ? "bg-lime-100 text-lime-800" : "bg-lime-50 text-lime-800")}>{el.value || el.percentage || '--'}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-lime-100 overflow-hidden">
                    <div className={cn("h-full rounded-full", idx === 0 ? "w-[92%] bg-lime-400" : "w-[78%] bg-lime-300")} />
                  </div>
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'comparison-dual':
        return frame(
          <div className="relative flex h-full items-center gap-2.5">
            <div className="flex-1 rounded-[18px] bg-white border border-lime-100 p-3">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-700/65">Before</div>
              <div className="mt-3 text-sm font-black text-lime-950 truncate">{primary?.label || 'Current state'}</div>
              <div className="mt-2 h-5 rounded-full bg-lime-100 overflow-hidden">
                <div className="h-full w-[42%] rounded-full bg-lime-400" />
              </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 h-10 w-10 rounded-full border-2 border-lime-500 bg-white flex items-center justify-center text-[10px] font-black text-lime-700 shadow-sm">
              VS
            </div>
            <div className="flex-1 rounded-[18px] bg-lime-50 border border-lime-100 p-3">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-700/65">After</div>
              <div className="mt-3 text-sm font-black text-lime-950 truncate">{secondary?.label || 'Storyline'}</div>
              <div className="mt-2 h-5 rounded-full bg-lime-200 overflow-hidden">
                <div className="h-full w-[88%] rounded-full bg-lime-500" />
              </div>
            </div>
          </div>,
          'p-2.5'
        );

      case 'comparison-before-after':
        return frame(
          <div className="flex h-full items-center gap-2">
            <div className="flex-1 rounded-[18px] bg-lime-50 border border-lime-100 p-3 flex flex-col justify-between">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-700/65">Before</div>
              <div className="text-lg font-black text-lime-950">{primary?.value || 'Low clarity'}</div>
              <div className="text-[10px] text-lime-800/70 truncate">{primary?.secondaryText || 'Dense notes'}</div>
            </div>
            <div className="w-8 flex flex-col items-center justify-center">
              <div className="h-px w-full bg-lime-200" />
              <div className="my-1 h-8 w-8 rounded-full bg-white border border-lime-200 flex items-center justify-center text-lime-700 text-[10px] font-black">→</div>
              <div className="h-px w-full bg-lime-200" />
            </div>
            <div className="flex-1 rounded-[18px] bg-white border border-lime-100 p-3 flex flex-col justify-between">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-700/65">After</div>
              <div className="text-lg font-black text-lime-950">{secondary?.value || 'Ready'}</div>
              <div className="text-[10px] text-lime-800/70 truncate">{secondary?.secondaryText || 'Polished output'}</div>
            </div>
          </div>,
          'p-2.5'
        );

      case 'comparison-pro-con':
        return frame(
          <div className="flex h-full flex-col justify-between gap-2">
            <div className="grid flex-1 grid-cols-2 gap-2">
              <div className="rounded-[18px] bg-lime-50 border border-lime-100 p-3">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-700/70">Cons</div>
                <div className="mt-2 text-sm font-black text-lime-950 truncate">{secondary?.label || 'Cons'}</div>
                <div className="mt-2 h-1.5 rounded-full bg-rose-100 overflow-hidden">
                  <div className="h-full w-[28%] rounded-full bg-rose-400" />
                </div>
              </div>
              <div className="rounded-[18px] bg-white border border-lime-100 p-3">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700/70">Pros</div>
                <div className="mt-2 text-sm font-black text-lime-950 truncate">{primary?.label || 'Pros'}</div>
                <div className="mt-2 h-1.5 rounded-full bg-lime-100 overflow-hidden">
                  <div className="h-full w-[74%] rounded-full bg-lime-500" />
                </div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-lime-100 overflow-hidden">
              <div className="h-full w-[62%] rounded-full bg-lime-500" />
            </div>
          </div>,
          'p-2.5'
        );

      case 'comparison-bars':
        return frame(
          <div className="flex h-full flex-col justify-between gap-2.5">
            {[primary, secondary, tertiary].filter(Boolean).map((el, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-14 shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{el?.label || `Bar ${idx + 1}`}</div>
                <div className="h-3 flex-1 rounded-full bg-lime-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", idx === 0 ? "w-[92%] bg-lime-500" : idx === 1 ? "w-[68%] bg-lime-400" : "w-[84%] bg-lime-300")} />
                </div>
                <div className="w-8 text-right text-[9px] font-black text-lime-950">{el?.percentage ?? el?.value ?? ''}</div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'comparison-tradeoff':
        return frame(
          <div className="grid h-full grid-cols-3 gap-2">
            {[primary, secondary, tertiary].map((el, idx) => (
              <div key={idx} className={cn("rounded-[18px] border p-2.5 shadow-sm", idx === 1 ? "bg-lime-50 border-lime-200 scale-[1.02]" : "bg-white border-lime-100")}>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{el?.label || `Option ${idx + 1}`}</div>
                <div className="mt-2 text-sm font-black text-lime-950 truncate">{el?.value || (idx === 1 ? 'Balanced' : 'Tradeoff')}</div>
                <div className="mt-2 h-1.5 rounded-full bg-lime-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", idx === 1 ? "w-[78%] bg-lime-500" : idx === 0 ? "w-[54%] bg-lime-300" : "w-[46%] bg-emerald-400")} />
                </div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'comparison-matrix':
        return frame(
          <div className="grid h-full grid-cols-2 gap-2">
            {elements.slice(0, 4).map((el, idx) => (
              <div key={idx} className={cn("rounded-[16px] border p-2.5", idx % 2 === 0 ? "bg-lime-50 border-lime-100" : "bg-white border-lime-100")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{el.label}</span>
                  <span className="text-[9px] font-black text-lime-900">{el.value || el.percentage || ''}</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {Array.from({ length: 4 }).map((_, cellIdx) => (
                    <div key={cellIdx} className={cn("h-2.5 rounded-sm", cellIdx <= idx ? "bg-lime-500" : "bg-lime-100")} />
                  ))}
                </div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'comparison-quadrant':
        return frame(
          <div className="relative h-full rounded-[18px] bg-white border border-lime-100 p-2.5">
            <div className="absolute inset-y-3 left-1/2 w-px bg-lime-200" />
            <div className="absolute inset-x-3 top-1/2 h-px bg-lime-200" />
            <div className="absolute left-4 top-4 text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65">High Impact</div>
            <div className="absolute right-4 top-4 text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65">High Effort</div>
            <div className="absolute left-4 bottom-4 text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65">Low Effort</div>
            <div className="absolute right-4 bottom-4 text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65">Low Impact</div>
            <div className="absolute left-[64%] top-[36%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-500 shadow-sm" />
          </div>,
          'p-2.5'
        );

      case 'comparison-heatmap':
        return frame(
          <div className="grid h-full grid-cols-2 gap-1.5">
            {elements.slice(0, 4).map((el, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-[16px] border p-2 flex flex-col justify-between",
                  idx === 0 ? "bg-lime-100 border-lime-200" : idx === 1 ? "bg-lime-50 border-lime-100" : idx === 2 ? "bg-emerald-50 border-emerald-100" : "bg-white border-lime-100"
                )}
              >
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-900/70 truncate">{el.label}</div>
                <div className="text-lg font-black leading-none text-lime-950">{el.value || el.percentage || '--'}</div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'process-timeline':
        return frame(
          <div className="relative flex h-full items-start justify-between gap-2 pt-4">
            <div className="absolute left-4 right-4 top-7 h-px bg-lime-200" />
            {elements.slice(0, 4).map((el, idx) => (
              <div key={idx} className="relative z-10 flex-1 text-center">
                <div className="mx-auto h-6 w-6 rounded-full border-2 border-lime-500 bg-white flex items-center justify-center text-[9px] font-black text-lime-700">
                  {String(idx + 1)}
                </div>
                <div className="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{el.label}</div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'process-roadmap':
        return frame(
          <div className="relative h-full">
            <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-lime-200" />
            <div className="flex h-full items-end gap-2">
              {elements.slice(0, 4).map((el, idx) => (
                <div key={idx} className={cn("flex-1", idx % 2 === 0 ? "mb-2" : "mt-2")}>
                  <div className="rounded-[16px] border border-lime-100 bg-white p-2.5 shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65">{el.value || `Q${idx + 1}`}</div>
                    <div className="mt-1 text-[10px] font-black text-lime-950 truncate">{el.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'process-zigzag':
        return frame(
          <div className="relative h-full">
            <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-lime-200" />
            <div className="flex h-full items-center gap-2">
              {elements.slice(0, 4).map((el, idx) => (
                <div key={idx} className={cn("flex-1", idx % 2 === 0 ? "self-start" : "self-end")}>
                  <div className="rounded-[16px] border border-lime-100 bg-lime-50 p-2.5 text-center shadow-sm">
                    <div className="mx-auto h-5 w-5 rounded-full bg-white border border-lime-200 flex items-center justify-center text-[9px] font-black text-lime-700">{idx + 1}</div>
                    <div className="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65 truncate">{el.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'process-vertical':
        return frame(
          <div className="flex h-full flex-col justify-between gap-1.5">
            {elements.slice(0, 4).map((el, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-lime-50 border border-lime-200 flex items-center justify-center text-[9px] font-black text-lime-800">{idx + 1}</div>
                <div className="flex-1 rounded-full bg-lime-100 overflow-hidden">
                  <div className={cn("h-2 rounded-full", idx === 0 ? "w-[80%] bg-lime-500" : idx === 1 ? "w-[68%] bg-lime-400" : idx === 2 ? "w-[56%] bg-emerald-400" : "w-[46%] bg-lime-300")} />
                </div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'process-pipeline':
        return frame(
          <div className="flex h-full items-end gap-1.5">
            {[100, 82, 62, 42].map((w, idx) => (
              <div
                key={idx}
                className="relative flex-1 overflow-hidden rounded-[16px] bg-lime-50 border border-lime-100 flex items-end justify-center"
                style={{ clipPath: `polygon(${10 + idx * 2}% 0, ${90 - idx * 2}% 0, 100% 100%, 0 100%)`, minHeight: `${28 + idx * 6}px` }}
              >
                <div className={cn("absolute inset-0", idx === 0 ? "bg-lime-200/70" : idx === 1 ? "bg-lime-300/70" : idx === 2 ? "bg-lime-400/70" : "bg-lime-500/85")} />
                <div className="relative z-10 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-lime-950">{idx + 1}</div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'process-swimlane':
        return frame(
          <div className="flex h-full flex-col gap-1.5">
            {elements.slice(0, 3).map((el, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-14 shrink-0 rounded-xl bg-lime-50 border border-lime-200 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">
                  Lane {idx + 1}
                </div>
                <div className="flex-1 rounded-full bg-lime-100 overflow-hidden">
                  <div className={cn("h-3 rounded-full", idx === 0 ? "w-[78%] bg-lime-500" : idx === 1 ? "w-[56%] bg-lime-400" : "w-[68%] bg-emerald-400")} />
                </div>
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'hierarchy-org':
        return frame(
          <div className="flex h-full flex-col gap-2">
            <div className="mx-auto w-20 rounded-[16px] bg-lime-50 border border-lime-200 px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">
              {primary?.label || 'Leadership'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {elements.slice(1, 4).map((el, idx) => (
                <div key={idx} className="rounded-[14px] bg-white border border-lime-100 px-2 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-lime-800 text-center truncate">
                  {el.label}
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'hierarchy-branch':
        return frame(
          <div className="flex h-full items-center gap-2.5">
            <div className="w-20 rounded-[16px] bg-lime-50 border border-lime-200 px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">
              {primary?.label || 'Root'}
            </div>
            <div className="flex-1 space-y-1.5">
              {elements.slice(1, 4).map((el, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="h-px w-4 bg-lime-200" />
                  <div className="flex-1 rounded-[14px] bg-white border border-lime-100 px-2 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">
                    {el.label}
                  </div>
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'hierarchy-pyramid':
        return frame(
          <div className="flex h-full flex-col justify-end gap-1.5 px-2">
            {[100, 82, 64, 46].map((width, idx) => {
              const el = elements[idx];
              return (
                <div
                  key={idx}
                  className={cn("mx-auto rounded-[14px] border px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.18em] truncate", idx === 0 ? "bg-lime-50 border-lime-200 text-lime-800" : idx === 1 ? "bg-lime-100 border-lime-100 text-lime-800" : idx === 2 ? "bg-lime-200 border-lime-100 text-lime-900" : "bg-lime-300 border-lime-200 text-lime-950")}
                  style={{ width: `${width}%` }}
                >
                  {el?.label || `Layer ${idx + 1}`}
                </div>
              );
            })}
          </div>,
          'p-2.5'
        );

      case 'hierarchy-stack':
        return frame(
          <div className="relative h-full pt-1">
            {elements.slice(0, 4).map((el, idx) => (
              <div
                key={idx}
                className={cn("absolute left-0 right-0 rounded-[16px] border px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] truncate shadow-sm", idx === 0 ? "top-0 bg-white border-lime-100" : idx === 1 ? "top-4 bg-lime-50 border-lime-100" : idx === 2 ? "top-8 bg-lime-100 border-lime-100" : "top-12 bg-lime-200 border-lime-200")}
                style={{ transform: `translateX(${idx * 4}px)` }}
              >
                {el.label}
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'hierarchy-nested':
        return frame(
          <div className="relative h-full rounded-[18px] border border-lime-100 bg-lime-50 p-2.5">
            <div className="absolute inset-4 rounded-[16px] border border-lime-200 bg-white" />
            <div className="absolute inset-8 rounded-[14px] border border-lime-100 bg-lime-50" />
            <div className="absolute inset-12 rounded-[12px] border border-lime-200 bg-white" />
            <div className="absolute left-3 top-3 text-[9px] font-black uppercase tracking-[0.18em] text-lime-700/65">{primary?.label || 'Nested Layers'}</div>
          </div>,
          'p-2.5'
        );

      case 'hierarchy-dependency':
        return frame(
          <div className="flex h-full items-center gap-2">
            {elements.slice(0, 4).map((el, idx) => (
              <React.Fragment key={idx}>
                <div className="rounded-[14px] bg-white border border-lime-100 px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">
                  {el.label}
                </div>
                {idx < 3 && <div className="text-lime-300 font-black">→</div>}
              </React.Fragment>
            ))}
          </div>,
          'p-2.5'
        );

      case 'pie-funnel':
        return frame(
          <div className="flex h-full flex-col justify-between gap-1">
            {[100, 82, 62, 42].map((width, idx) => (
              <div
                key={idx}
                className={cn("mx-auto rounded-[14px] border text-center text-[9px] font-black uppercase tracking-[0.18em]", idx === 0 ? "bg-lime-50 border-lime-200 text-lime-800" : idx === 1 ? "bg-lime-100 border-lime-100 text-lime-800" : idx === 2 ? "bg-lime-200 border-lime-100 text-lime-900" : "bg-lime-500 border-lime-500 text-white")}
                style={{ width: `${width}%`, padding: '4px 8px' }}
              >
                {elements[idx]?.label || `Stage ${idx + 1}`}
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      case 'pie-network':
        return frame(
          <div className="relative flex h-full items-center justify-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-lime-100" />
              <div className="absolute inset-3 rounded-full border-4 border-lime-300" />
              <div className="absolute inset-[18px] rounded-full bg-lime-500" />
            </div>
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={cn("absolute h-3 w-3 rounded-full shadow-sm", idx === 0 ? "left-4 top-6 bg-lime-200" : idx === 1 ? "right-5 top-5 bg-lime-300" : idx === 2 ? "left-6 bottom-5 bg-lime-400" : "right-6 bottom-6 bg-emerald-400")}
              />
            ))}
          </div>,
          'p-2.5'
        );

      case 'pie-rings':
        return frame(
          <div className="flex h-full items-center gap-2.5">
            <div className="relative h-16 w-16 shrink-0">
              <div className="absolute inset-0 rounded-full border-4 border-lime-100" />
              <div className="absolute inset-2 rounded-full border-4 border-lime-300" />
              <div className="absolute inset-4 rounded-full border-4 border-lime-500 border-t-transparent border-r-transparent" />
            </div>
            <div className="flex-1 space-y-1.5">
              {elements.slice(0, 3).map((el, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">
                  <span className={cn("h-2.5 w-2.5 rounded-full", idx === 0 ? "bg-lime-500" : idx === 1 ? "bg-lime-300" : "bg-emerald-400")} />
                  {el.label}
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'pie-donut':
        return frame(
          <div className="flex h-full items-center gap-2.5">
            <div className="relative h-16 w-16 shrink-0">
              <div className="absolute inset-0 rounded-full border-8 border-lime-100" />
              <div className="absolute inset-2 rounded-full border-8 border-lime-300" />
              <div className="absolute inset-[18px] rounded-full bg-white border border-lime-100" />
            </div>
            <div className="flex-1 space-y-1.5">
              {elements.slice(0, 3).map((el, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 rounded-full bg-lime-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-lime-800">
                  <span className="truncate">{el.label}</span>
                  <span>{el.percentage ?? el.value ?? ''}</span>
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'pie-allocation':
        return frame(
          <div className="flex h-full items-center gap-2.5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-lime-100 bg-conic from-lime-200 via-lime-400 to-emerald-400">
              <div className="absolute inset-[18px] rounded-full bg-white border border-lime-100" />
            </div>
            <div className="flex-1 space-y-1.5">
              {elements.slice(0, 3).map((el, idx) => (
                <div key={idx} className="rounded-full bg-white border border-lime-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-lime-800 truncate">
                  {el.label}
                </div>
              ))}
            </div>
          </div>,
          'p-2.5'
        );

      case 'pie-radial-bars':
        return frame(
          <div className="flex h-full items-end justify-between gap-1.5">
            {[18, 28, 36, 26, 32].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={cn("w-full rounded-t-full", idx % 2 === 0 ? "bg-lime-300" : "bg-lime-500")} style={{ height: `${height}px` }} />
                <div className="h-1.5 w-1.5 rounded-full bg-lime-200" />
              </div>
            ))}
          </div>,
          'p-2.5'
        );

      default:
        return frame(
          <div className="flex h-full items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-lime-100 border-t-lime-500" />
          </div>,
          'p-2.5'
        );
    }
  };

  const handleRemoveGraphicElement = (slideIdx: number, elIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.graphic || slide.graphic.elements.length <= 1) return;
    const updatedElements = slide.graphic.elements.filter((_, idx) => idx !== elIdx);
    handleUpdateGraphicField(slideIdx, 'elements', updatedElements);
  };

  // Quiz helpers
  const handleUpdateQuizField = (slideIdx: number, field: keyof InteractiveQuiz, value: any) => {
    const slide = data.slides[slideIdx];
    const updatedQuiz = {
      ...(slide.quiz || { question: 'Key Question?', options: ['Option A', 'Option B'], correctAnswerIndex: 0 }),
      [field]: value
    };
    updateSlideField(slideIdx, 'quiz', updatedQuiz);
  };

  const handleUpdateQuizOption = (slideIdx: number, oIdx: number, value: string) => {
    const slide = data.slides[slideIdx];
    if (!slide.quiz) return;
    const updatedOptions = [...slide.quiz.options];
    updatedOptions[oIdx] = value;
    handleUpdateQuizField(slideIdx, 'options', updatedOptions);
  };

  const handleAddQuizOption = (slideIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.quiz) return;
    const updatedOptions = [...slide.quiz.options, `New Option`];
    handleUpdateQuizField(slideIdx, 'options', updatedOptions);
  };

  const handleRemoveQuizOption = (slideIdx: number, oIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.quiz || slide.quiz.options.length <= 2) return;
    const updatedOptions = slide.quiz.options.filter((_, idx) => idx !== oIdx);
    
    // Adjust correct answer index if needed
    let correctIdx = slide.quiz.correctAnswerIndex;
    if (correctIdx >= updatedOptions.length) {
      correctIdx = updatedOptions.length - 1;
    }
    
    const updatedQuiz = {
      ...slide.quiz,
      options: updatedOptions,
      correctAnswerIndex: correctIdx
    };
    updateSlideField(slideIdx, 'quiz', updatedQuiz);
  };

  const handleRemoveQuizEntirely = (slideIdx: number) => {
    updateSlideField(slideIdx, 'quiz', undefined);
  };

  const handleAddQuizEntirely = (slideIdx: number) => {
    const defaultQuiz: InteractiveQuiz = {
      question: 'Verify the audience understanding:',
      options: ['Correct Answer Option', 'Alternative Option B', 'Alternative Option C'],
      correctAnswerIndex: 0
    };
    updateSlideField(slideIdx, 'quiz', defaultQuiz);
  };

  // Links helpers
  const handleUpdateLink = (slideIdx: number, lIdx: number, key: keyof InteractiveLink, value: string) => {
    const slide = data.slides[slideIdx];
    if (!slide.links) return;
    const updatedLinks = [...slide.links];
    updatedLinks[lIdx] = {
      ...updatedLinks[lIdx],
      [key]: value
    };
    updateSlideField(slideIdx, 'links', updatedLinks);
  };

  const handleAddLink = (slideIdx: number) => {
    const slide = data.slides[slideIdx];
    const newLink = { title: 'Reference Article', url: 'https://example.com' };
    const updatedLinks = slide.links ? [...slide.links, newLink] : [newLink];
    updateSlideField(slideIdx, 'links', updatedLinks);
  };

  const handleRemoveLink = (slideIdx: number, lIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.links) return;
    const updatedLinks = slide.links.filter((_, idx) => idx !== lIdx);
    updateSlideField(slideIdx, 'links', updatedLinks.length > 0 ? updatedLinks : undefined);
  };

  // Form submit finalize
  const handleFinaliseClick = () => {
    // Basic verification
    if (!data.title || data.title.trim() === '') {
      alert("Please specify an overall presentation title.");
      return;
    }
    
    // Proceed
    onFinalise(data, theme, theme === 'custom' ? customSettings : undefined);
  };

  const handleSaveClick = async (saveAsNew = false) => {
    if (!onSave) return;
    if (!data.title || data.title.trim() === '') {
      alert("Please specify an overall presentation title.");
      return;
    }
    await onSave(data, theme, theme === 'custom' ? customSettings : undefined, saveAsNew);
  };

  useEffect(() => () => clearAutoSaveTimer(), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-emerald-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-lime-200/70 bg-white/90 backdrop-blur">
        <div className="px-4 md:px-6 py-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-lime-500 text-lime-950 flex items-center justify-center shadow-sm border border-lime-600/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-lg font-black tracking-tight text-lime-950 truncate">Storyline Blueprint Editor</h1>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-lime-100 text-lime-800">Slide-first</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  Slide {activeSlideIndex + 1} / {data.slides.length}
                </span>
                {saveStatus && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {saveStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-lime-900/60 font-semibold truncate">Work the current slide, preview it live, and open the graphic catalog when you need a new visual style.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowRawTextPanel((v) => !v)}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer",
                showRawTextPanel ? "bg-lime-950 border-lime-950 text-lime-50" : "bg-white border-lime-200 text-lime-950 hover:bg-lime-50"
              )}
            >
              <FileText className="w-4 h-4" />
              Source
            </button>
            {onSave && savedDeckId && (
              <button
                onClick={() => handleSaveClick(true)}
                className="px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 border border-lime-200 bg-white hover:bg-lime-50 text-lime-950 cursor-pointer transition-all"
              >
                Save Copy
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 border border-lime-200 bg-white hover:bg-lime-50 text-lime-950 cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleFinaliseClick}
              className="px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 bg-lime-950 text-lime-50 hover:bg-lime-900 cursor-pointer transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-lime-300" />
              Finalise & Present
            </button>
          </div>
        </div>
      </header>

      <div className="relative">
        <AnimatePresence initial={false}>
          {showRawTextPanel && (
            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              className="fixed left-0 top-[73px] bottom-0 z-30 w-[min(38vw,420px)] border-r border-lime-200 bg-white/95 backdrop-blur shadow-xl overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-lime-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-lime-700" />
                    <span className="text-sm font-black text-lime-950">Source text</span>
                  </div>
                  <button onClick={handleCopyRawText} className="p-2 rounded-xl border border-lime-200 bg-white hover:bg-lime-50">
                    {copiedRawText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-lime-700" />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
                  {data.rawParsedText || 'No parsed text returned from this file.'}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className={cn("px-4 md:px-6 py-5", showRawTextPanel ? "xl:pl-[min(38vw,420px)]" : "")}>
          <div className="grid grid-cols-1 xl:grid-cols-[270px_minmax(0,1fr)_380px] gap-4 min-h-[calc(100vh-138px)]">
            <aside className="order-1 rounded-[20px] border border-lime-200 bg-white/90 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-lime-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Slides</div>
                  <div className="text-sm font-black text-lime-950">{data.slides.length} total</div>
                </div>
                <button
                  onClick={handleAddSlide}
                  className="h-9 w-9 rounded-xl bg-lime-950 text-lime-50 flex items-center justify-center hover:bg-lime-900 transition-colors"
                  title="Add slide"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {data.slides.map((slide, idx) => {
                  const isActive = idx === activeSlideIndex;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => setActiveSlide(idx)}
                      className={cn(
                        "w-full text-left rounded-[18px] border p-3 transition-all",
                        isActive ? "border-lime-700 bg-lime-50 ring-2 ring-lime-500/10" : "border-lime-100 bg-white hover:border-lime-200 hover:bg-lime-50/40"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0", isActive ? "bg-lime-950 text-lime-50" : "bg-lime-100 text-lime-800")}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-black text-lime-950 truncate">{slide.title || '(Untitled Slide)'}</div>
                            {isActive && <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-lime-100 text-lime-900">Active</span>}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">{slide.content.length} bullets</span>
                            {slide.graphic && <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-lime-100 text-lime-800">{slide.graphic.type}</span>}
                            {slide.quiz && <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Quiz</span>}
                            {slide.links && slide.links.length > 0 && <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800">Links</span>}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-1.5">
                        <button onClick={(e) => handleMoveSlide(idx, 'up', e)} disabled={idx === 0} className="p-1.5 rounded-lg border border-lime-100 bg-white disabled:opacity-30" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => handleMoveSlide(idx, 'down', e)} disabled={idx === data.slides.length - 1} className="p-1.5 rounded-lg border border-lime-100 bg-white disabled:opacity-30" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => duplicateSlide(idx)} className="p-1.5 rounded-lg border border-lime-100 bg-white" title="Duplicate slide"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => handleRemoveSlide(idx, e)} className="p-1.5 rounded-lg border border-lime-100 bg-white text-red-500" title="Delete slide"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={handleAddSlide}
                  className="w-full rounded-[18px] border border-dashed border-lime-200 bg-lime-50/30 py-3 text-sm font-black text-lime-800 hover:bg-lime-50 transition-colors"
                >
                  Add slide
                </button>
              </div>
            </aside>

            <main className="order-3 xl:order-2 space-y-4">
              <section className="rounded-[22px] border border-lime-200 bg-white/95 shadow-sm overflow-hidden">
                <div className="border-b border-lime-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Live Slide</div>
                    <div className="text-sm font-black text-lime-950 truncate">{activeSlide?.title || 'Untitled slide'}</div>
                  </div>
                  <button
                    onClick={() => setGraphicDrawerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-2 text-xs font-black text-lime-900 hover:bg-lime-100 transition-colors"
                  >
                    <GalleryVerticalEnd className="w-4 h-4" />
                    Open Graphic Library
                  </button>
                </div>
                <div className="p-4 md:p-6">
                  <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-lime-50 p-4 md:p-6 min-h-[520px] shadow-inner">
                    <div className="mx-auto max-w-4xl">
                      <div className="rounded-[18px] bg-white border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Preview</div>
                            <h2 className="text-xl font-black text-slate-950 truncate">{activeSlide?.title || 'Untitled Slide'}</h2>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-lime-100 text-lime-800">
                            {activeSlide?.graphic ? activeSlide.graphic.type : 'Text only'}
                          </div>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] p-5">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Slide bullets</div>
                              <div className="space-y-2">
                                {activeSlide?.content.map((point, idx) => (
                                  <div key={idx} className="flex gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-lime-500 shrink-0" />
                                    <div className="text-sm leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: point }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            {activeSlide?.speakerNotes && (
                              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700 mb-1">Speaker notes</div>
                                <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">{activeSlide.speakerNotes}</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            {activeSlide?.graphic ? (
                              <InteractiveGraphic
                                graphic={activeSlide.graphic}
                                accentClass="bg-lime-500"
                                isVerticalMode={false}
                              />
                            ) : (
                              <div className="min-h-[320px] rounded-[18px] border border-dashed border-lime-200 bg-lime-50/40 flex flex-col items-center justify-center text-center p-6">
                                <LayoutGrid className="w-10 h-10 text-lime-300 mb-3" />
                                <div className="text-sm font-black text-lime-900">No graphic selected</div>
                                <p className="mt-2 text-xs text-lime-900/60 max-w-[24rem]">Open the graphic library to choose a preset, then edit labels and values in the Visual tab.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[22px] border border-lime-200 bg-white/95 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-lime-100 flex flex-wrap items-center gap-2">
                  {([
                    ['content', 'Content', ClipboardList],
                    ['visual', 'Visual', GalleryVerticalEnd],
                    ['interact', 'Interact', MessageSquareText],
                    ['theme', 'Theme', Palette]
                  ] as Array<[InspectorTab, string, any]>).map(([tab, label, Icon]) => {
                    const selected = inspectorTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setInspectorTab(tab)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black border transition-colors",
                          selected ? "bg-lime-950 text-lime-50 border-lime-950" : "bg-white text-lime-950 border-lime-200 hover:bg-lime-50"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 md:p-5 space-y-4">
                  {inspectorTab === 'content' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Slide title</label>
                        <input
                          type="text"
                          value={activeSlide?.title || ''}
                          onChange={(e) => updateSlideField(activeSlideIndex, 'title', e.target.value)}
                          className="w-full rounded-2xl border border-lime-200 bg-white px-4 py-3 text-base font-bold text-slate-900 outline-none focus:border-lime-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Bullets</label>
                          <button onClick={() => handleAddBullet(activeSlideIndex)} className="text-xs font-black text-lime-800 flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            Add bullet
                          </button>
                        </div>
                        <div className="space-y-3">
                          {activeSlide?.content.map((point, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-2">
                              <span className="mt-4 h-2 w-2 rounded-full bg-lime-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <HtmlBulletEditor
                                  value={point}
                                  onChange={(newValue) => handleUpdateBullet(activeSlideIndex, pIdx, newValue)}
                                  placeholder="Add a concise bullet"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveBullet(activeSlideIndex, pIdx)}
                                disabled={activeSlide?.content.length <= 1}
                                className="mt-1 rounded-xl border border-slate-200 p-2 text-slate-400 disabled:opacity-30"
                                title="Delete bullet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Speaker notes</label>
                        <textarea
                          value={activeSlide?.speakerNotes || ''}
                          onChange={(e) => updateSlideField(activeSlideIndex, 'speakerNotes', e.target.value)}
                          rows={4}
                          className="w-full rounded-2xl border border-lime-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-lime-500 resize-y"
                        />
                      </div>
                    </div>
                  )}

                  {inspectorTab === 'visual' && (
                    <div className="space-y-4">
                      <div className="rounded-[18px] border border-lime-200 bg-lime-50/40 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Graphic preview</div>
                            <div className="text-sm font-black text-lime-950">{activeSlide?.graphic ? activeSlide.graphic.title || activeSlide.graphic.type : 'No graphic selected'}</div>
                          </div>
                          <button
                            onClick={() => setGraphicDrawerOpen(true)}
                            className="rounded-full border border-lime-200 bg-white px-3 py-2 text-xs font-black text-lime-900"
                          >
                            Open Graphic Library
                          </button>
                        </div>
                        <div className="rounded-[18px] border border-lime-200 bg-white p-3 min-h-[280px]">
                          {activeSlide?.graphic ? (
                            <InteractiveGraphic graphic={activeSlide.graphic} accentClass="bg-lime-500" isVerticalMode={false} />
                          ) : (
                            <div className="h-[250px] flex flex-col items-center justify-center text-center text-lime-900/60">
                              <GalleryVerticalEnd className="w-10 h-10 text-lime-300 mb-2" />
                              Pick a preset from the library to start.
                            </div>
                          )}
                        </div>
                      </div>

                      {activeSlide?.graphic && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-lime-700 mb-1">Graphic title</label>
                              <input
                                type="text"
                                value={activeSlide.graphic.title || ''}
                                onChange={(e) => handleUpdateGraphicField(activeSlideIndex, 'title', e.target.value)}
                                className="w-full rounded-2xl border border-lime-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Graphic nodes</label>
                            <button onClick={() => handleAddGraphicElement(activeSlideIndex)} className="text-xs font-black text-lime-800 flex items-center gap-1">
                              <ListPlus className="w-3.5 h-3.5" />
                              Add node
                            </button>
                          </div>
                          <div className="space-y-3">
                            {activeSlide.graphic.elements.map((el, elIdx) => (
                              <div key={elIdx} className="rounded-[18px] border border-slate-100 bg-white p-3 space-y-3 relative">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGraphicElement(activeSlideIndex, elIdx)}
                                  disabled={activeSlide.graphic!.elements.length <= 1}
                                  className="absolute right-2 top-2 rounded-lg border border-slate-200 p-1 text-slate-400 disabled:opacity-30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="grid grid-cols-1 gap-3 pr-8">
                                  <input
                                    type="text"
                                    value={el.label}
                                    onChange={(e) => handleUpdateGraphicElement(activeSlideIndex, elIdx, 'label', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-lime-500"
                                    placeholder="Label"
                                  />
                                  <input
                                    type="text"
                                    value={el.value || ''}
                                    onChange={(e) => handleUpdateGraphicElement(activeSlideIndex, elIdx, 'value', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-lime-500"
                                    placeholder="Value"
                                  />
                                  <input
                                    type="text"
                                    value={el.secondaryText || ''}
                                    onChange={(e) => handleUpdateGraphicElement(activeSlideIndex, elIdx, 'secondaryText', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-lime-500"
                                    placeholder="Description"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={el.percentage !== undefined ? el.percentage : ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                      handleUpdateGraphicElement(activeSlideIndex, elIdx, 'percentage', val);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-lime-500"
                                    placeholder="Percentage"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {inspectorTab === 'interact' && (
                    <div className="space-y-4">
                      <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Quiz</div>
                            <div className="text-sm font-black text-lime-950">{activeSlide?.quiz ? 'Enabled' : 'Disabled'}</div>
                          </div>
                          {!activeSlide?.quiz ? (
                            <button onClick={() => handleAddQuizEntirely(activeSlideIndex)} className="rounded-full border border-lime-200 px-3 py-2 text-xs font-black text-lime-900">Add quiz</button>
                          ) : (
                            <button onClick={() => handleRemoveQuizEntirely(activeSlideIndex)} className="rounded-full border border-red-200 px-3 py-2 text-xs font-black text-red-600">Remove quiz</button>
                          )}
                        </div>
                        {activeSlide?.quiz && (
                          <div className="mt-4 space-y-3">
                            <input
                              type="text"
                              value={activeSlide.quiz.question}
                              onChange={(e) => handleUpdateQuizField(activeSlideIndex, 'question', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-lime-500"
                            />
                            <div className="space-y-2">
                              {activeSlide.quiz.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`slide-quiz-correct-${activeSlideIndex}`}
                                    checked={activeSlide.quiz?.correctAnswerIndex === oIdx}
                                    onChange={() => handleUpdateQuizField(activeSlideIndex, 'correctAnswerIndex', oIdx)}
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleUpdateQuizOption(activeSlideIndex, oIdx, e.target.value)}
                                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-lime-500"
                                  />
                                  <button onClick={() => handleRemoveQuizOption(activeSlideIndex, oIdx)} disabled={activeSlide.quiz.options.length <= 2} className="rounded-lg border border-slate-200 p-2 text-slate-400 disabled:opacity-30">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-[18px] border border-slate-100 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Links</div>
                          <button onClick={() => handleAddLink(activeSlideIndex)} className="rounded-full border border-lime-200 px-3 py-2 text-xs font-black text-lime-900">Add link</button>
                        </div>
                        {activeSlide?.links?.length ? (
                          <div className="space-y-2">
                            {activeSlide.links.map((link, lIdx) => (
                              <div key={lIdx} className="rounded-2xl border border-slate-100 p-3 space-y-2 relative">
                                <button onClick={() => handleRemoveLink(activeSlideIndex, lIdx)} className="absolute right-2 top-2 rounded-lg border border-slate-200 p-1 text-slate-400">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="text"
                                  value={link.title}
                                  onChange={(e) => handleUpdateLink(activeSlideIndex, lIdx, 'title', e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-lime-500"
                                  placeholder="Title"
                                />
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => handleUpdateLink(activeSlideIndex, lIdx, 'url', e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-lime-500"
                                  placeholder="https://example.com"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">No links on this slide yet.</div>
                        )}
                      </div>

                      <div className="rounded-[18px] border border-slate-100 bg-white p-4 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Video URL</div>
                        <input
                          type="url"
                          value={activeSlide?.videoUrl || ''}
                          onChange={(e) => updateSlideField(activeSlideIndex, 'videoUrl', e.target.value || undefined)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-lime-500"
                          placeholder="https://www.youtube.com/embed/..."
                        />
                      </div>
                    </div>
                  )}

                  {inspectorTab === 'theme' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Theme</label>
                        <div className="grid gap-2">
                          {THEMES.map((t) => {
                            const isSelected = theme === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() => commitThemeChange(t.id)}
                                className={cn(
                                  "flex items-start gap-3 rounded-[18px] border p-3 text-left transition-all",
                                  isSelected ? "border-lime-700 bg-lime-50" : "border-lime-200 bg-white hover:bg-lime-50/50"
                                )}
                              >
                                <div className={cn("mt-0.5 h-4 w-4 rounded-full border", t.colors)} />
                                <div>
                                  <div className="text-sm font-black text-lime-950">{t.name}</div>
                                  <div className="text-xs text-lime-900/55">{t.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {theme === 'custom' && (
                        <div className="space-y-4 rounded-[18px] border border-lime-200 bg-lime-50/40 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Custom settings</div>
                          <div className="grid grid-cols-1 gap-3">
                            <select value={customSettings.fontFamily} onChange={(e) => commitCustomSettingsChange((current) => ({ ...current, fontFamily: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs">
                              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                              <select value={customSettings.alignment} onChange={(e) => commitCustomSettingsChange((current) => ({ ...current, alignment: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs">
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                              <select value={customSettings.spacing} onChange={(e) => commitCustomSettingsChange((current) => ({ ...current, spacing: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs">
                                <option value="compact">Compact</option>
                                <option value="normal">Normal</option>
                                <option value="relaxed">Relaxed</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="color" value={customSettings.primaryColor} onChange={(e) => commitCustomSettingsChange((current) => ({ ...current, primaryColor: e.target.value }))} className="h-10 w-full rounded-xl border border-slate-200" />
                              <input type="color" value={customSettings.backgroundColor} onChange={(e) => commitCustomSettingsChange((current) => ({ ...current, backgroundColor: e.target.value }))} className="h-10 w-full rounded-xl border border-slate-200" />
                              <input type="color" value={customSettings.textColor} onChange={(e) => commitCustomSettingsChange((current) => ({ ...current, textColor: e.target.value }))} className="h-10 w-full rounded-xl border border-slate-200" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </main>

            <aside className="order-2 xl:order-3 rounded-[22px] border border-lime-200 bg-white/95 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-lime-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Deck settings</div>
                  <div className="text-sm font-black text-lime-950">Theme and status</div>
                </div>
                <button
                  onClick={() => setInspectorTab('theme')}
                  className="rounded-full border border-lime-200 bg-lime-50 px-3 py-2 text-xs font-black text-lime-900"
                >
                  Theme
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Deck title</div>
                  <input
                    type="text"
                    value={data.title}
                    onChange={(e) => commitDataChange((current) => ({ ...current, title: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-black text-slate-900 outline-none focus:border-lime-500"
                    placeholder="E.g. Fiscal Analysis Q2 2026"
                  />
                </div>
                <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Quick actions</div>
                      <div className="text-sm font-black text-lime-950">Current slide</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => duplicateSlide(activeSlideIndex)} className="rounded-full border border-lime-200 px-3 py-2 text-xs font-black text-lime-900">Duplicate</button>
                    <button onClick={(e) => handleMoveSlide(activeSlideIndex, 'up', e)} className="rounded-full border border-lime-200 px-3 py-2 text-xs font-black text-lime-900">Up</button>
                    <button onClick={(e) => handleMoveSlide(activeSlideIndex, 'down', e)} className="rounded-full border border-lime-200 px-3 py-2 text-xs font-black text-lime-900">Down</button>
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-100 bg-lime-50/40 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Autosave</div>
                  <div className="mt-2 text-sm font-black text-lime-950">{saveStatus || (savedDeckId ? 'Saved deck' : 'Working draft')}</div>
                  <p className="mt-1 text-xs text-lime-900/60">Edits persist after each action.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {graphicDrawerOpen && (
          <motion.div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGraphicDrawerOpen(false)}>
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-4 top-4 bottom-4 mx-auto max-w-6xl rounded-[24px] bg-white shadow-2xl border border-lime-200 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-lime-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700">Graphic library</div>
                  <div className="text-lg font-black text-lime-950">Choose a preset for the active slide</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={graphicSearch}
                    onChange={(e) => setGraphicSearch(e.target.value)}
                    placeholder="Search presets"
                    className="w-56 rounded-full border border-lime-200 bg-white px-4 py-2 text-sm outline-none focus:border-lime-500"
                  />
                  <button onClick={() => setGraphicDrawerOpen(false)} className="rounded-full border border-lime-200 bg-white p-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="border-b border-lime-100 px-4 py-3 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {GRAPHIC_CATEGORY_ORDER.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setGraphicCategory(category.id)}
                      className={cn(
                        "rounded-full px-3 py-2 text-xs font-black border transition-colors",
                        graphicCategory === category.id ? "bg-lime-950 text-lime-50 border-lime-950" : "bg-white text-lime-950 border-lime-200 hover:bg-lime-50"
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {filteredGraphicGroups.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-lime-200 bg-lime-50/40 px-4 py-10 text-center">
                    <div className="text-sm font-black text-lime-950">No presets match this filter.</div>
                    <div className="mt-1 text-xs text-lime-900/60">Try another category or clear the search term.</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredGraphicGroups.map((group) => (
                      <section key={group.label} className="space-y-3">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-700">{group.label}</div>
                            <div className="text-xs font-black text-lime-950">{group.presets.length} preset{group.presets.length === 1 ? '' : 's'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {group.presets.map((preset) => {
                            const selected = !!activeSlide?.graphic && activeSlide.graphic.type === preset.preview?.type && (activeSlide.graphic.style || DEFAULT_GRAPHIC_STYLE_BY_TYPE[activeSlide.graphic.type]) === (preset.preview?.style || DEFAULT_GRAPHIC_STYLE_BY_TYPE[preset.preview?.type || activeSlide.graphic.type]);
                            return (
                              <button
                                key={preset.name}
                                onClick={() => {
                                  openGraphicPreset(preset);
                                  setGraphicDrawerOpen(false);
                                }}
                                className={cn(
                                  "group text-left rounded-[22px] border p-3 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5",
                                  selected ? "border-lime-700 ring-2 ring-lime-500/10 bg-lime-50/60" : "border-lime-200 bg-white hover:border-lime-300"
                                )}
                              >
                                <div className="relative">
                                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="relative mb-3 overflow-hidden rounded-[24px] border border-lime-100 bg-lime-50/50 p-2.5">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,249,157,0.34),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.12),transparent_42%)]" />
                                    <div className="relative">
                                      {renderGraphicThumbnail(preset)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-sm font-black text-lime-950 truncate">{preset.name}</div>
                                    <div className="mt-1 text-[10px] leading-relaxed text-lime-900/55 line-clamp-2">{preset.desc}</div>
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-lime-100 text-lime-800 shrink-0">
                                    {GRAPHIC_PRESET_CATEGORY[preset.name]}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
