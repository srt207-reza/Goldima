"use client";

type LoaderProps = {
    className?: string;
};

export function Loader({ className = "" }: LoaderProps) {
    return (
        <div className={["loader-wrapper", className].filter(Boolean).join(" ")} aria-label="Loading">
            <div className="loader-circle" />
            <div className="loader-circle" />
            <div className="loader-circle" />
            <div className="loader-shadow" />
            <div className="loader-shadow" />
            <div className="loader-shadow" />

            <style jsx>{`
                .loader-wrapper {
                    width: 200px;
                    height: 70px;
                    position: relative;
                    z-index: 1;
                }

                .loader-circle {
                    width: 20px;
                    height: 20px;
                    position: absolute;
                    border-radius: 50%;
                    background-color: #fff;
                    left: 15%;
                    transform-origin: 50%;
                    animation: loader-circle-bounce 0.5s alternate infinite ease;
                }

                .loader-circle:nth-child(2) {
                    left: 45%;
                    animation-delay: 0.2s;
                }

                .loader-circle:nth-child(3) {
                    left: auto;
                    right: 15%;
                    animation-delay: 0.3s;
                }

                .loader-shadow {
                    width: 20px;
                    height: 4px;
                    border-radius: 50%;
                    background-color: rgba(0, 0, 0, 0.9);
                    position: absolute;
                    top: 62px;
                    transform-origin: 50%;
                    z-index: -1;
                    left: 15%;
                    filter: blur(1px);
                    animation: loader-shadow-pulse 0.5s alternate infinite ease;
                }

                .loader-shadow:nth-child(5) {
                    left: 45%;
                    animation-delay: 0.2s;
                }

                .loader-shadow:nth-child(6) {
                    left: auto;
                    right: 15%;
                    animation-delay: 0.3s;
                }

                @keyframes loader-circle-bounce {
                    0% {
                        top: 60px;
                        height: 5px;
                        border-radius: 50px 50px 25px 25px;
                        transform: scaleX(1.7);
                    }

                    40% {
                        height: 20px;
                        border-radius: 50%;
                        transform: scaleX(1);
                    }

                    100% {
                        top: 0%;
                    }
                }

                @keyframes loader-shadow-pulse {
                    0% {
                        transform: scaleX(1.5);
                    }

                    40% {
                        transform: scaleX(1);
                        opacity: 0.7;
                    }

                    100% {
                        transform: scaleX(0.2);
                        opacity: 0.4;
                    }
                }
            `}</style>
        </div>
    );
}

export function FullPageLoader() {
    return (
        <div className="grid min-h-screen place-items-center bg-brand-base px-4">
            <Loader />
        </div>
    );
}

export default Loader;
