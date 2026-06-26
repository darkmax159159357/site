"use client";
import { Dialog, DialogHeader, DialogBody } from "@material-tailwind/react";
import useModal from "@/hooks/useModal";
import { FormEvent, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ThreeDots } from "react-loader-spinner";
import { MotionDiv } from "../motion/MotionDiv";
import "./style.css";
import NavLink from "../navlink/NavLink";
import { fetchSearch } from "@/action/fetchKomik";

type DataFetch = {
  id: string;
  title: string;
  cover: string;
  description?: string;
  genre?: string;
  chapters?: any[];
};

// Debounce function to delay search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const DialogAlert = ({ handler, open, setOpen }: any) => {
  const { setSearch, search } = useModal();
  const [data, setData] = useState<DataFetch[]>([]);
  const [loading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(search, 500); // 500ms delay
  
  // Perform search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    } else {
      setData([]);
    }
  }, [debouncedSearchTerm]);
  
  const performSearch = async (query: string) => {
    if (!query || query.trim() === '') {
      setData([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use only direct function from fetchKomik
      const results = await fetchSearch(query.trim());
      
      if (results && Array.isArray(results)) {
        console.log("Search results from local file:", results);
        // Log the cover URLs to debug
        results.forEach((item, index) => {
          console.log(`Item ${index} cover URL:`, item.cover);
        });
        setData(results);
      } else {
        console.log("Search returned no results in local file");
        setData([]);
      }
    } catch (err) {
      console.error("Search error while accessing local file:", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmitSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    performSearch(search);
  };
  
  const variant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  
  return (
    <>
      <Dialog
        placeholder="Dialog"
        open={open}
        size="lg"
        handler={handler}
        className="bg-transparent shadow-sm "
      >
        <DialogHeader
          className="flex sm:items-center gap-2 justify-start sm:justify-between flex-wrap"
          placeholder="Dialog Header"
        >
          <h1 className="text-lg font-normal text-white font-karla flex items-center gap-2">
            For quick access:
            <div className="">
              <span className="px-2 py-1 rounded-lg text-xs uppercase bg-[#262931]  ">
                ctrl
              </span>
              &nbsp;&nbsp;+&nbsp;&nbsp;
              <span className="px-2 py-1 rounded-lg text-xs uppercase bg-[#262931]">
                s
              </span>
            </div>
          </h1>
        </DialogHeader>
        <DialogBody className="mt-2" placeholder="Dialog Body">
          <div className="inputSearch relative">
            <form action="" onSubmit={handleSubmitSearch}>
              <input
                type="text"
                className="bg-[#262931] outline-none border-none text-white py-4 px-6 font-karla w-full rounded-full placeholder:text-white transition-all duration-300 focus:ring-2 focus:ring-orange-500"
                placeholder="Search manga titles..."
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.trim() === '') {
                    setData([]);
                  }
                }}
                value={search}
                autoFocus
              />
              {search && (
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                  onClick={() => {
                    setSearch('');
                    setData([]);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </form>
          </div>
          {loading ? (
            <div className="bg-[#262931] flex justify-center items-center h-16 w-full mt-3 rounded-xl">
              <ThreeDots
                height="80"
                width="80"
                radius="9"
                color="#8E9C91"
                ariaLabel="three-dots-loading"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
              />
            </div>
          ) : (
            <div
              className={`content bg-[#262931] mt-3 rounded-xl ${
                data.length > 3
                  ? "h-[30vh]"
                  : data.length === 0 && !search
                  ? "h-0"
                  : "h-[40vh]"
              } overflow-y-scroll`}
              id="customScrollThumb"
            >
              {data.length > 0 ? (
                <ul className="listSearch py-2 px-2">
                  {data?.map((item: DataFetch, i: number) => (
                    <NavLink href={`/manga/${item.id}`} key={i}>
                      <MotionDiv
                        className="item group"
                        variants={variant}
                        animate="visible"
                        initial="hidden"
                        transition={{
                          delay: i * 0.15,
                          ease: "easeInOut",
                          duration: "0.5",
                        }}
                        viewport={{ amount: 0 }}
                      >
                        <li className="flex gap-3 hover:bg-[#3a3e4b] cursor-pointer p-3 rounded-xl transition-all duration-300">
                          <div className="logo">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 relative shadow-md group-hover:shadow-lg transition-all duration-300">
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 animate-pulse"></div>
                              
                              <Image
                                src={item.cover || "/fallback-image.svg"}
                                alt={item.title}
                                width={64}
                                height={64}
                                loading="eager"
                                priority={i < 3}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 relative z-10"
                                onError={(e) => {
                                  console.log("Image failed to load:", item.cover);
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = "/fallback-image.svg";
                                }}
                              />
                            </div>
                          </div>
                          <div className="py-1 flex-1">
                            <h3 className="font-karla text-white text-lg font-semibold group-hover:text-orange-400 transition-colors duration-300">
                              {item.title}
                            </h3>
                            <p className="font-karla text-gray-300 text-sm">
                              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {item.chapters?.length || 0} chapters
                              </span>
                              {item.genre && (
                                <span className="ml-2 text-gray-400">{item.genre.split(',')[0]}</span>
                              )}
                            </p>
                          </div>
                        </li>
                      </MotionDiv>
                    </NavLink>
                  ))}
                </ul>
              ) : search && !loading ? (
                <div className="flex flex-col items-center justify-center h-full py-8 px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-300 text-center font-karla text-lg">No manga found matching &quot;{search}&quot;</p>
                  <p className="text-gray-400 text-sm text-center mt-2 font-karla">Try a different search term</p>
                </div>
              ) : null}
              {data?.length < 3 ? (
                ""
              ) : (
                <NavLink
                  href={`/search?q=${search.toLowerCase()}`}
                  className="w-full mt-5 bottom-0 flex justify-center text-white sm:text-lg font-semibold text-center py-3 font-karla bg-[#30333d] text-base hover:bg-[#3a3e4b] transition-colors duration-300 rounded-xl"
                >
                  View More
                </NavLink>
              )}
            </div>
          )}
        </DialogBody>
      </Dialog>
    </>
  );
};

export default DialogAlert;
