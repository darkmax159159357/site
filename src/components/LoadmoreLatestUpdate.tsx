"use client";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { fetchLastUpdated } from "@/action/fetchKomik";
import { usePathname } from "next/navigation";
import Image from "next/image";
import MangaCard from "./MangaCard";
import { LatestUpdateType } from "@/types/latestUpdateType";

let page = 2;

const LoadmoreLatestUpdate = () => {
  const path = usePathname();
  const { ref, inView } = useInView();
  const [data, setData] = useState<LatestUpdateType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNext, setHasNext] = useState(true);

  useEffect(() => {
    if (inView && hasNext && !isLoading) {
      setIsLoading(true);
      fetchLastUpdated()
        .then((res: any) => {
          if (res?.data && res?.data.length > 0) {
            setData([...data, ...res.data]);
            setHasNext(res?.has_next || false);
          } else {
            setHasNext(false);
          }
        })
        .catch((err) => {
          console.log("Error loading more data:", err);
          setHasNext(false);
        })
        .finally(() => {
          setIsLoading(false);
          page++;
        });
    }
  }, [inView, data, path, hasNext, isLoading]);

  return (
    <>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mt-5">
        {data.map((item, i) => {
          return (
            <MangaCard
              key={`loadmore-${item.id}-${i}`}
              id={item.id}
              title={item.title}
              cover={item.cover}
              rating={parseFloat(item.rating) || 4.5}
              status="ONGOING"
              chapter="Chapter 1"
              country="jp"
              slug={item.manga_slug || item.id}
              chapters={item.chapters.map((ch) => ({
                number: ch.number,
                title: ch.title,
                date: ch.added_chap_date || ch.added_date || ch.release_date || new Date().toISOString(),
                added_chap_date: ch.added_chap_date,
                added_date: ch.added_date,
                release_date: ch.release_date
              }))}
              genres={item.genres || ["ACTION", "FANTASY"]}
              has_chapters={true}
            />
          );
        })}
      </div>
      
      {hasNext && (
        <section className="flex justify-center items-center w-full mt-4">
          <div ref={ref}>
            {isLoading ? (
              <Image
                src="/spinner.svg"
                alt="spinner"
                width={56}
                height={56}
                className="object-contain"
              />
            ) : (
              <div className="h-10"></div>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default LoadmoreLatestUpdate;
