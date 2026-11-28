type UnderConstructionPageProps = {
  title: string;
};

/** Provisional role home page; its content arrives in later sprints. */
export function UnderConstructionPage({ title }: UnderConstructionPageProps) {
  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-2 text-zinc-700">Em construção</p>
    </section>
  );
}
