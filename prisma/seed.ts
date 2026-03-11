import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seeding...')

  // Create Categories from PRD
  const categories = [
    { name: 'Layouts', slug: 'layouts', description: 'Application layouts and macro structures' },
    { name: 'Navigation', slug: 'navigation', description: 'Headers, navbars, and sidebar systems' },
    { name: 'Hero Sections', slug: 'hero-sections', description: 'Landing page hero areas and headers' },
    { name: 'Feature Sections', slug: 'feature-sections', description: 'Interative and static product feature showcases' },
    { name: 'Cards', slug: 'cards', description: 'Information display cards, content, and data cards' },
    { name: 'Components', slug: 'components', description: 'Standard UI components and inputs' },
    { name: 'Dashboards', slug: 'dashboards', description: 'Admin panel and data UI layouts' },
    { name: 'Animations', slug: 'animations', description: 'Animated UI elements and interactions' },
    { name: 'Micro Interactions', slug: 'micro-interactions', description: 'Small interactive details like hovers and toggles' },
    { name: 'Visual Effects', slug: 'visual-effects', description: 'Backgrounds, glassmorphism, glows, and effects' },
  ]

  for (const c of categories) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    })
    console.log(`Created category: ${category.name}`)
  }

  // Create Tags
  const defaultTags = ['dark', 'light', 'glass', 'minimal', 'saas', 'luxury', 'framer-motion', 'dashboard', 'ai', 'animated', 'interactive']
  for (const t of defaultTags) {
    await prisma.tag.upsert({
      where: { name: t },
      update: {},
      create: { name: t },
    })
  }

  // Helper to fetch Category ID
  const getCatId = async (slug: string) => {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) throw new Error(`Category not found: ${slug}`);
    return cat.id;
  };

  const navId = await getCatId('navigation');
  const heroId = await getCatId('hero-sections');
  const cardsId = await getCatId('cards');
  const layoutsId = await getCatId('layouts');
  const componentsId = await getCatId('components');
  const dashboardsId = await getCatId('dashboards');
  const animationsId = await getCatId('animations');


  // Component Seed Data (Representing the variety from PRD)
  const seedComponents = [
    {
      name: 'Floating Pill Navbar',
      description: 'A premium floating navigation bar with backdrop blur and responsive menu.',
      categoryId: navId,
      variants: [{ name: 'Glass Style', previewImage: '/placeholder-nav.png', promptFragment: 'Include a centrally floated pill navbar with glassmorphism backdrop filter and smooth scroll spy behavior.', code: 'export function Nav() { return <nav className="glass-pill">...</nav> }' }]
    },
    {
      name: 'Cinematic Hero Grid',
      description: 'A striking full-viewport hero section with dynamic grid backgrounds.',
      categoryId: heroId,
      variants: [{ name: 'Dark Mode Mesh', previewImage: '/placeholder-hero.png', promptFragment: 'Build a cinematic hero section using a dark radial gradient mesh background and central dramatic typography.', code: 'export function Hero() { return <section className="cinematic-hero">...</section> }' }]
    },
    {
       name: 'Glassmorphic Bento Grid',
       description: 'A modern bento box style layout using glassmorphism effects for feature highlights.',
       categoryId: cardsId,
       variants: [{ name: 'Standard Layout', previewImage: '/placeholder-bento.png', promptFragment: 'Implement a bento grid layout with 4 distinct cards. Apply heavy glassmorphism, noise texture overlays, and subtle glowing borders.', code: 'export function Bento() { return <div className="bento-grid">...</div> }' }]
    },
    {
       name: 'Sidebar Dashboard Layout',
       description: 'A classic SaaS application shell with collapsible sidebar and top-right user controls.',
       categoryId: layoutsId,
       variants: [{ name: 'Collapsible Modern', previewImage: '/placeholder-layout.png', promptFragment: 'Create a full-screen dashboard layout with a collapsible left sidebar, breadcrumbs top navigation, and a scrollable main content area structured in a CSS grid.', code: 'export function Layout() { return <main className="dashboard-layout">...</main> }' }]
    },
     {
       name: 'Interactive Stats Dashboard',
       description: 'Live data display with sparklines and metric cards.',
       categoryId: dashboardsId,
       variants: [{ name: 'Telemetry View', previewImage: '/placeholder-dashboard.png', promptFragment: 'Design a data telemetry dashboard featuring metric cards with positive/negative trend indicators and small SVG sparkline charts.', code: 'export function Stats() { return <div className="stats-grid">...</div> }' }]
    },
    {
       name: 'Magnetic Hover Button',
       description: 'A button that slightly follows the cursor on hover.',
       categoryId: animationsId,
       variants: [{ name: 'Framer Motion Spring', previewImage: '/placeholder-button.png', promptFragment: 'Implement a magnetic button that uses physics-based spring animations to attract the button to the cursor position during hover states.', code: 'export function MagneticBtn() { return <motion.button>...</motion.button> }' }]
    },
    {
       name: 'SaaS Newsletter Input',
       description: 'Minimalist highly-converting subscription input.',
       categoryId: componentsId,
       variants: [{ name: 'Inline Glow Focus', previewImage: '/placeholder-input.png', promptFragment: 'Add a clean newsletter subscription input field that expands slightly and casts a subtle brand-colored glow drop-shadow when focused.', code: 'export function Newsletter() { return <form className="glow-input">...</form> }' }]
    },
    {
       name: 'Minimal Large Type Footer',
       description: 'A bold, typography-driven footer emphasizing brand identity.',
       categoryId: layoutsId,
       variants: [{ name: 'Editorial Dark', previewImage: '/placeholder-footer.png', promptFragment: 'Construct an editorial footer featuring oversized, bold typography for the brand name, intersecting with a minimal grid of footer links.', code: 'export function Footer() { return <footer>...</footer> }' }]
    }
  ];

  for (const compData of seedComponents) {
    const component = await prisma.component.create({
      data: {
        name: compData.name,
        description: compData.description,
        categoryId: compData.categoryId,
        variants: {
          create: compData.variants.map(v => ({
            name: v.name,
            previewImage: v.previewImage,
            promptFragment: v.promptFragment,
            codeSnippet: {
              create: {
                language: 'tsx',
                code: v.code
              }
            }
          }))
        }
      }
    });
    console.log(`Created Component: ${component.name}`);
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
