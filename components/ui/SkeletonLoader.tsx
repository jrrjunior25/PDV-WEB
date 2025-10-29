interface SkeletonLoaderProps {
  className?: string;
}

const SkeletonLoader = ({ className = '' }: SkeletonLoaderProps) => {
  return (
    <div
      className={`bg-gray-200 rounded-md animate-pulse ${className}`}
    />
  );
};

export default SkeletonLoader;
