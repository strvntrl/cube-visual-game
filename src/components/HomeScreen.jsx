export default function HomeScreen({ onStart }) {
    return (
        <div className="relative fade-in w-full min-h-screen flex items-center justify-center px-4 py-6 overflow-hidden">
            
            {/* Glow Background */}
            <div
                className="absolute -top-10 -left-10 w-32 sm:w-40 h-32 sm:h-40 rounded-full blur-3xl opacity-30"
                style={{ background: "#f9a8d4" }}
            />
            <div
                className="absolute -bottom-10 -right-10 w-36 sm:w-44 h-36 sm:h-44 rounded-full blur-3xl opacity-30"
                style={{ background: "#c084fc" }}
            />

            {/* Card */}
            <div
                className="
                    relative 
                    overflow-hidden 
                    rounded-[2rem] 
                    w-full 
                    max-w-md 
                    p-6 
                    sm:p-8 
                    md:p-10 
                    text-center
                "
                style={{
                    background: "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(18px)",
                    boxShadow: "0 10px 50px rgba(236,72,153,0.18)"
                }}
            >

                {/* Decorative Stars */}
                <div className="absolute top-4 left-4 sm:top-5 sm:left-5 text-pink-300 text-lg sm:text-xl animate-pulse">
                    ✦
                </div>
                <div className="absolute top-5 right-5 sm:top-6 sm:right-6 text-purple-300 text-base sm:text-lg animate-pulse">
                    ✧
                </div>
                <div className="absolute bottom-5 left-6 sm:bottom-6 sm:left-8 text-pink-200 text-xs sm:text-sm animate-pulse">
                    ✦
                </div>

                {/* Icon */}
                <div className="mb-5 sm:mb-6 flex justify-center items-center">
                    <img
                        src="/icon.png"
                        alt="Foldables Logo"
                        className="
                            w-24 h-24
                            sm:w-28 sm:h-28
                            md:w-32 md:h-32
                            object-cover
                        "
                    />
                </div>

                {/* Title */}
                <div className="mb-3 sm:mb-4">
                    <h1
                        className="
                            text-3xl
                            sm:text-4xl
                            md:text-5xl
                            font-black
                            tracking-tight
                            break-words
                        "
                        style={{
                            background:
                                "linear-gradient(135deg, #ec4899, #a855f7)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontFamily: "Georgia, serif"
                        }}
                    >
                        Foldables!
                    </h1>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center gap-2 mb-6 sm:mb-7">
                    <div className="w-8 sm:w-10 h-[2px] bg-pink-200 rounded-full" />
                    <div className="w-2 h-2 rounded-full bg-pink-300" />
                    <div className="w-8 sm:w-10 h-[2px] bg-purple-200 rounded-full" />
                </div>

                {/* Button */}
                <button
                    onClick={onStart}
                    className="
                        group 
                        relative 
                        w-100% 
                        overflow-hidden 
                        rounded-2xl 
                        py-3 sm:py-4
                        px-5 sm:px-6
                        text-white 
                        font-bold 
                        text-base sm:text-lg
                        transition-all 
                        duration-300 
                        active:scale-95
                    "
                    style={{
                        background:
                            "linear-gradient(135deg, #ec4899, #a855f7)",
                        boxShadow:
                            "0 8px 25px rgba(236,72,153,0.35)"
                    }}
                >

                    {/* Shine Effect */}
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <span className="relative flex items-center justify-center gap-2">
                        Mulai Main
                    </span>
                </button>
            </div>
        </div>
    );
}