export default function HomeScreen({ onStart }) {
    return (
        <div className="fade-in text-center w-full max-w-md mx-auto px-4 sm:px-0">
            <div className="mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-pink-600 mb-2 animate-bounce">
                    Cube Visual Game
                </h1>
                {/* <p className="text-base sm:text-lg text-purple-600 font-medium">
                    Latih Kemampuan Visual Spasialmu ✨
                </p> */}
            </div>

            <div className="bg-white/90 p-6 sm:p-8 rounded-3xl shadow-2xl">
                <button
                    onClick={onStart}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-4 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-base sm:text-lg"
                >
                    Mulai Bermain 🚀
                </button>
            </div>
        </div>
    );
}