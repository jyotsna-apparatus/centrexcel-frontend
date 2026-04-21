import { Fragment } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import Image from "next/image";

const steps = [
  {
    step: 1,
    title: "Pick your own Challenge",
    description: "Browse real problems from companies.",
    img: "/t.png",
  },
  {
    step: 2,
    title: "Build Your Solution",
    description: "Compete individually or as a team.",
    img: "/icons/buildYourSolution.png",
  },
  {
    step: 3,
    title: "Get Recognized & Hired",
    description: "Win rewards or unlock career opportunities.",
    img: "/icons/trophy.png",
  },
];

const steps2 = [
  {
    title: "Get Job Offers",
    description: "Get hired by top companies.",
    img: "/icons/jobOffer.png",
  },
  {
    title: "Win Cash Prizes",
    description: "Compete for exciting rewards.",
    img: "/icons/cash.png",
  },
  {
    title: "Launch Your Startup",
    description: "Access incubation and support.",
    img: "/icons/launch.png",
  },
  {
    title: "Earn Certificates",
    description: "Get noticed and verified skills.",
    img: "/icons/doc.png",
  },
];

const steps3 = [
  {
    title: "Skill Scoring",
    description: "Ai-drivien sill assessment",
    img: "/icons/gear.png",
  },
  {
    title: "Solutions Evaluation",
    description: "Automated and objective reviews",
    img: "/icons/skill.png",
  },
  {
    title: "Resume-Less Hiring",
    description: "Ai-drivien sill assessment",
    img: "/r.png",
  },
];

const HowItWorks = () => {
  return (
    <>
      <section id="how-it-works" className="parent py-[100px]">
        <div className="container px-4 flex flex-col items-center gap-6">
          <div className="w-full  flex flex-col items-center gap-4 px-6 py-8">
            <h2
              className="h2 text-center"
              data-aos="fade-up"
              data-aos-delay="0"
            >
              How it <span>Works</span>
            </h2>
            <p
              className="p1 text-center max-w-2xl"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Get from signup to submission in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full ">
            {steps.map((item, i) => (
              <Fragment key={item.step}>
                <div className="special-card-outer">
                  <div className=" p-6 special-card-inner">
                    <div
                      key={item.step}
                      className="flex flex-1 flex-col items-center text-center gap-3 min-w-0"
                    >
                      <div className="flex  rounded-lg !text-cs-primary text-2xl font-bold bg-white/10 border border-cs-primary w-10 h-10 items-center justify-center">
                        {item.step}
                      </div>
                      <div className="relative w-full h-[150px] ">
                        <Image src={item.img} alt={item.title} fill className="object-contain" />
                      </div>
                      <h3 className="h3">{item.title}</h3>
                      <p className="p1">{item.description}</p>
                    </div>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section  className="parent py-[100px]">
        <div className="container px-4 flex flex-col items-center gap-6">
          <div className="w-full flex flex-col items-center gap-4 px-6 py-8 ">
            <h2
              className="h2 text-center"
              data-aos="fade-up"
              data-aos-delay="0"
            >
             Real Outcomes to Propel Your <span>Career</span>
            </h2>
           
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6 w-full ">
            {steps2.map((item, i) => (
             
                <div className="special-card-outer">
                  <div className=" p-6 special-card-inner">
                    <div
                      key={i.toString()}
                      className="flex flex-1 flex-col items-center text-center gap-3 min-w-0"
                    >
                 
                      <div className="relative w-full h-[150px] ">
                        <Image src={item.img} alt={item.title} fill className="object-contain" />
                      </div>
                      <h3 className="h3">{item.title}</h3>
                      <p className="p1">{item.description}</p>
                    </div>
                  </div>
                </div>
         
            ))}
          </div>
        </div>
      </section>

      <section  className="parent py-[100px]">
        <div className="container px-4 flex flex-col items-center gap-6">
          <div className="w-full max-w-3xl flex flex-col items-center gap-4 px-6 py-8">
            <h2
              className="h2 text-center"
              data-aos="fade-up"
              data-aos-delay="0"
            >
              Powered by <span>AI Talent Intelligence</span> 
            </h2>
            <p className="p1 text-center max-w-2xl">
              Our AI-powered platform evaluates solutions objectively, identifies top talent, and streamlines the hiring process.
            </p>
    
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3  gap-6 w-full ">
            {steps3.map((item, i) => (
             
                <div className="special-card-outer">
                  <div className=" p-6 special-card-inner">
                    <div
                      key={i.toString()}
                      className="flex flex-1 flex-col items-center text-center gap-3 min-w-0"
                    >
                 
                      <div className="relative w-full h-[150px] ">
                        <Image src={item.img} alt={item.title} fill className="object-contain" />
                      </div>
                      <h3 className="h3">{item.title}</h3>
                      <p className="p1">{item.description}</p>
                    </div>
                  </div>
                </div>
         
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HowItWorks;
