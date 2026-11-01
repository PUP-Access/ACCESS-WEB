"use client"

import Image from "next/image"

interface Contributor {
  name: string
  role: string
  image: string
  backdropImage?: string
}

const CONTRIBUTORS: Contributor[] = [
  {
    name: "Zachary Ralf\nCrescel Charles\nDG. Nudalo",
    role: "Project Manager",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Charles.jpg",
  },
  {
    name: "Gerald S.\nBerongoy",
    role: "System/Business Analyst",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Gerald.jpg",
  },
  {
    name: "Ren Fernandez\nZapanta",
    role: "Scrum Master",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/SM.jpg",
  },
  {
    name: "Renz Tyrone F.\nArcilla",
    role: "Lead Backend Developer",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Renz.jpg",
  },
  {
    name: "Arvie\nLastra",
    role: "Backend Developer",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Arviee.jpg",
  },
  {
    name: "Earl Clyde M.\nBañez",
    role: "Lead Frontend Developer",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Earl.jpg",
  },
  {
    name: "Elton James U.\nDonato",
    role: "Frontend Developer",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Elton.jpg",
  },
  {
    name: "Sophia\nLim",
    role: "Lead UI/UX",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Phia.jpg",
  },
  {
    name: "Blessie Jane\nAlba",
    role: "UI/UX",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Blessie.jpg",
  },
  {
    name: "Clark Jao\nAlarcon",
    role: "QA & Data Integrity",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Clark.jpg",
  },
];

interface OtherCollaborator {
  name: string
  role: string
}

const OTHER_COLLABORATORS: OtherCollaborator[] = [
  {
    name: "Romulo Ramos Jr.",
    role: "Backend & RBAC",
  },
  {
    name: "Jaiqouse Layag",
    role: "Quality Assurance & Data Integrity",
  },
  // Add other collaborators here:
  // { name: "Full Name", role: "Role / Contribution" },
];

export default function ContributorsSection() {
  return (
    <section className="relative overflow-hidden py-16 px-5 sm:px-8 md:px-16 lg:px-24">

      {/* ── Content ── */}
      <div className="relative z-20 mx-auto max-w-7xl w-full flex flex-col items-center">
        
        {/* Title */}
        <h2 
          className="mb-6 text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-widest drop-shadow-xl title-header"
          style={{
             WebkitBackgroundClip: 'text',
             WebkitTextFillColor: 'transparent',
             backgroundClip: 'text',
          }}
        >Collaborators
          
        </h2>

        {/* Cards Wrapper */}
        <div className="flex flex-wrap justify-center items-center gap-0 w-full" style={{ gap: '6px' }}>
          {CONTRIBUTORS.map((contributor, idx) => (
            <div key={idx} className="flex flex-col items-center flex-shrink-0 mb-6 sm:mb-0">
              {/* Skewed Container */}
              <div 
                className="relative overflow-hidden group transition-all duration-300 hover:-translate-y-2 z-10"
                style={{
                  width: '160px',
                  height: '345px',
                  transform: 'skewX(-11deg) translateZ(0)',
                  background: '#12161a',
                  border: '1px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                  isolation: 'isolate',
                }}
              >
                {/* Content un-skewed */}
                <div 
                  className="absolute flex flex-col justify-end overflow-hidden"
                  style={{ 
                    left: '-38px',
                    right: '-38px',
                    top: '-15px',
                    bottom: '-15px',
                    transform: 'skewX(11deg)',
                    transformOrigin: 'center'
                  }}
                >
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(circle at 50% 30%, #252e35 0%, #161c20 50%, #0e1215 100%)'
                    }}
                  />
                
                  
                  {/* Backdrop Photo */}
                  {contributor.backdropImage && (
                    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
                       <Image 
                          src={contributor.backdropImage} 
                          alt="" 
                          fill
                          className="object-cover object-[center_top] opacity-40"
                       />
                    </div>
                  )}
                  
                  {/* Person Photo */}
                  <div 
                    className="absolute inset-0 z-10 flex justify-center items-end"
                    style={{ transform: 'translateY(22px)' }}
                  >
                     <Image 
                        src={contributor.image} 
                        alt={contributor.name} 
                        fill
                        className="object-cover object-top opacity-95"
                     />
                  </div>

                  {/* Skewed Gradient - all in below */}
                  <div 
                    className="absolute z-20 pointer-events-none" 
                    style={{
                      left: '-20%', right: '-20%', bottom: '-10%', height: '70%',
                      background: 'linear-gradient(to top, rgba(230,80,20,1) 0%, rgba(230,80,20,0.85) 25%, rgba(230,80,20,0.3) 50%, transparent 100%)',
                      transform: 'skewY(-11deg)'
                    }}
                  />
                </div>

                {/* Name Overlay */}
                <div className="absolute inset-x-0 bottom-0 z-30 pb-6 flex justify-center items-end pointer-events-none">
                  <div 
                    style={{ transform: 'skewX(11deg)' }}
                    className="w-full max-w-[136px] px-1 text-center"
                  >
                    <p className="font-bold text-white text-xs sm:text-[13px] leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                       {contributor.name.split('\n').map((line, i) => (
                        <span key={i} className="block whitespace-nowrap">{line}</span>
                      ))}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Role Text Below */}
              <div className="mt-4 text-center pr-15">
                <p className="font-bold text-sm tracking-wide" style={{ color: "#E3835B" }}>
                  {contributor.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Text-Only Other Collaborators Section */}
        {OTHER_COLLABORATORS.length > 0 && (
          <div className="mt-24 w-full flex flex-col items-center max-w-5xl mx-auto border-t border-white/10 pt-12">
            <h4 
              className="mb-4 text-center text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-widest title-header"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Special Thanks to
            </h4>

            <ul className="flex flex-col items-center gap-3 w-full max-w-xl mx-auto px-4">
              {OTHER_COLLABORATORS.map((collab, idx) => (
                <li
                  key={idx}
                  className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-6 py-2.5 text-sm sm:text-base shadow-md"
                >
                  <span className="font-bold text-white tracking-wide">{collab.name}</span>
                  <span className="text-zinc-500 font-light">-</span>
                  <span className="font-medium text-[#E3835B] tracking-wide">{collab.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
