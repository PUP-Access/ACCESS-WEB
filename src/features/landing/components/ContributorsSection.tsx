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
    name: "Zachary Ralf Crescel Charles DG. Nudalo",
    role: "Project Manager",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Charles.jpg",
  },
  {
    name: "Gerald S. Berongoy",
    role: "System/Business Analyst",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Gerald.jpg",
  },
  {
    name: "Ren Fernandez Zapanta",
    role: "Scrum Master",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/SM.jpg",
  },
  {
    name: "Renz Tyrone F. Arcilla",
    role: "Lead Backend Developer",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Renz.jpg",
  },
  {
    name: "Arvie Lastra",
    role: "Backend Developer",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Arviee.jpg",
  },
  {
    name: "Earl Clyde M. Bañez",
    role: "Lead Frontend Developer",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Earl.jpg",
  },
  {
    name: "Elton James U. Donato",
    role: "Frontend Developer",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Elton.jpg",
  },
  {
    name: "Sophia Lim",
    role: "Lead UI/UX",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Phia.jpg",
  },
  {
    name: "Blessie Jane Alba",
    role: "UI/UX",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Blessie.jpg",
  },
  {
    name: "Clark Jao Alarcon",
    role: "QA & Data Integrity",
    backdropImage: "/BG-ACCESS.webp",
    image: "/collaborators-image/Clark.jpg",
  },
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
        >
          The Minds Behind the Work
        </h2>
        
        {/* Subtitle */}
        <div className="mb-10 text-center text-xs sm:text-sm md:text-base max-w-3xl mx-auto leading-loose text-white font-medium relative flex flex-col items-center gap-2">
          <span className="relative inline-block pb-1 px-2">
            Recognizing the individuals whose dedication and collaboration made this project possible. Together, their work shaped the outcome of this project.
          </span>
            
        </div>

        {/* Second Title */}
        <h3 
          className="mb-12 text-center text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-widest title-header"
          style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Contributors
        </h3>

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

                  {/* Name */}
                  <div className="relative z-30 pb-7 pr-10 w-full text-center">
                    <p className="font-bold text-white text-sm leading-tight drop-shadow-md px-2">
                       {contributor.name.split('\n').map((line, i) => (
                        <span key={i} className="block">{line}</span>
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

        {/* Text-Only Contributors Section 
        <div className="mt-24 w-full flex flex-col items-center max-w-5xl mx-auto border-t border-white/10 pt-12">
          <h4 className="mb-8 text-center text-2xl sm:text-3xl font-bold tracking-widest text-zinc-100 title-header">
            Additional Contributors
          </h4>
          
          <div className="text-center">
            <p className="text-zinc-400 text-sm sm:text-base italic max-w-2xl mx-auto">
              This space is dedicated to future contributors who will help maintain and grow the project. They will be listed here in recognition of their efforts.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-x-12 gap-y-6">
              <div className="flex flex-col">
                <span className="font-bold text-zinc-200">Charles Nudalo</span>
                <span className="text-xs text-[#E3835B]">Kupal</span>
              </div>
            </div> 
          
          </div>
        </div>
        */}
      </div>
    </section>
  )
}
