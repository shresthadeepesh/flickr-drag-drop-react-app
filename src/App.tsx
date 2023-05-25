import "./styles.css";
import Flickr from "flickr-sdk";
import { useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DragDropContextProps
} from "react-beautiful-dnd";
// const Flickr = require("flickr-sdk");
import { v4 as uuidv4 } from "uuid";

const apiKey = "cf33252fa4936f3e4eef5813c58ce8a5";

const flickr = new Flickr(apiKey);

interface Photo {
  farm: number;
  id: string;
  owner: string;
  secret: string;
  server: string;
  title: string;
}

const test = async (search: string): Promise<Photo[]> => {
  // const { body } = await flickr.photos.getInfo({
  //   photo_id: "2636"
  // });

  const { body } = ((await flickr.photos.search({
    // tags: "dog,cat,mouse",
    text: search,
    per_page: 5
  })) as unknown) as {
    body: {
      photos: {
        photo: Photo[];
      };
    };
  };

  return body.photos.photo;
};

const prepareImgUrl = (image: Photo) => {
  return `https://live.staticflickr.com/${image.server}/${image.id}_${image.secret}_w.jpg`;
};

interface Grouped {
  id: string;
  title: string;
  photos: Photo[];
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [search, setSearch] = useState<string>();
  const [groups, setGroups] = useState<Grouped[]>([]);

  const handleChange = (e: any) => {
    setSearch(e.target.value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const keyword = e.target.search.value;

    if (keyword) {
      if (
        groups.length > 1 &&
        groups.find(
          (it) => it.title.toLocaleLowerCase() === keyword.toLocaleLowerCase()
        )
      ) {
        return;
      }

      const result = await test(keyword);
      setPhotos([...photos, ...result]);

      const group = {
        id: uuidv4(),
        title: keyword,
        photos: result
      };

      setGroups([group, ...groups]);
      setSearch("");
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const draggedPhoto = photos?.find((el) => el.id === result.draggableId);

      if (draggedPhoto) {
        const updatedGroup = groups.map((el) => {
          if (el.id === destination.droppableId) {
            return {
              ...el,
              photos: [draggedPhoto, ...el.photos]
            } as Grouped;
          } else if (el.id === source.droppableId) {
            return {
              ...el,
              photos: el.photos.filter((it) => it.id !== draggedPhoto.id)
            } as Grouped;
          }

          return el;
        });

        setGroups(updatedGroup);
      }
    }
  };

  return (
    <div className="App">
      <div className="">
        <h1>The Awesome Lawson's Garden...</h1>
        {search ? <div className="">Searching: {search}</div> : null}

        <form onSubmit={handleSubmit}>
          <input
            name="search"
            type="text"
            placeholder="Search..."
            onChange={handleChange}
            value={search}
          />
          <input type="submit" value="Search" />
        </form>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {groups?.map((el) => (
          <Droppable droppableId={el.id} key={el.id}>
            {(provided, snapshot) => {
              return (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{
                    background: snapshot.isDraggingOver
                      ? "lightblue"
                      : "lightgrey",
                    padding: 4,
                    // width: 250,
                    minHeight: 500
                  }}
                  className="droppable-region"
                >
                  <div className="group-title">{el.title}</div>
                  <div className="flex">
                    {el.photos
                      ? el.photos.map((el, index) => (
                          <Draggable
                            key={el.id}
                            draggableId={el.id}
                            index={index}
                          >
                            {(provided, snapshot) => {
                              return (
                                <div
                                  className=""
                                  {...provided.draggableProps}
                                  ref={provided.innerRef}
                                  {...provided.dragHandleProps}
                                  style={{
                                    userSelect: "none",
                                    minHeight: "50px",
                                    backgroundColor: snapshot.isDragging
                                      ? "#263B4A"
                                      : "lightgray",
                                    color: "white",
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <div className="m-2" key={el.id}>
                                    <img
                                      src={prepareImgUrl(el)}
                                      alt={el.title}
                                    />
                                  </div>
                                </div>
                              );
                            }}
                          </Draggable>
                        ))
                      : null}
                  </div>

                  {provided.placeholder}
                </div>
              );
            }}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
}
