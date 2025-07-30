function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className='flex flex-col items-center text-center p-4'>
      <div className='flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4'>
        <Icon className='w-6 h-6' />
      </div>
      <h3 className='font-headline font-semibold text-lg mb-1'>{title}</h3>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  );
}

export { FeatureCard };
