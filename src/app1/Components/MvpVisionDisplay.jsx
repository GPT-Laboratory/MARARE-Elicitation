import TextArea from 'antd/es/input/TextArea';
import { Breadcrumb, Form } from 'antd/lib';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

const MvpVisionDisplay = () => {
    const { id, storyId } = useParams();
    const { mvp, vision } = useSelector((state) => state.MainStates_Slice);
    const {
        projects,
        userStories,
    } = useSelector((state) => state.main);
    const project = projects.find((project) => project.id === id);
    const selectedUserStory =
        userStories.find((story) => story._id === storyId) ||
        userStories.find((story) => story.stories.some((s) => s._id === storyId));
    const [textBox, setTextBox] = useState({
        vision: vision,
        mvp: mvp,
    });

    useEffect(() => {
        if (selectedUserStory) {
            // handleUpload(); // Call/ handleUpload when a valid story is selected
            // setNewVersion(false)
            setTimeout(() => {
                handleUpload();
            }, 100);
        } else {
            handleClearUpload() // Call handleClearUpload when no story is selected
        }
    }, [selectedUserStory]);


    const handleClearUpload = () => {
        setTextBox({

            vision: vision,
            mvp: mvp,

        });

    };


    const handleUpload = () => {

        setTextBox({
            vision: selectedUserStory.vision,
            mvp: selectedUserStory.mvp,

            user_analysis: "",
        });

    };

    return (
        <div className='w-[80%] m-auto'>

            <div
                style={{
                    display: " flex",
                    margin: "0px auto",
                    marginBottom: "20px",
                }}
            >
                <Breadcrumb
                    style={{
                        marginBottom: "10px",
                        // marginLeft: '40px'
                    }}
                >
                    <Breadcrumb.Item>
                        <Link to="/">Projects List</Link>
                    </Breadcrumb.Item>
                    {project && (
                        <Breadcrumb.Item>
                            <Link to={`/project_details/${project.project_name}/${id}`}>
                               meeting list
                            </Link>
                        </Breadcrumb.Item>
                    )}
                     <Breadcrumb.Item>
                        Data
                    </Breadcrumb.Item>

                    {/* <Breadcrumb.Item><Link to="/agent_list">Agents List</Link></Breadcrumb.Item> */}
                </Breadcrumb>
            </div>
            <Form
                layout="vertical"
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Form.Item
                    label="Vision Textbox"
                    style={{ flex: "1 1 70%", marginRight: "5px" }}
                >
                    <TextArea
                        readonly
                        rows={24}
                        placeholder="Enter your objective"
                        value={textBox.vision}
                        onChange={(e) =>
                            setTextBox({
                                ...textBox,
                                vision: e.target.value,
                            })
                        }
                        style={{ color: "black" }}
                    />
                </Form.Item>

                <Form.Item
                    label="MVP Textbox"
                    style={{ flex: "1 1 70%", marginRight: "5px" }}
                >
                    <TextArea
                        readonly
                        rows={24}
                        placeholder="Enter your objective"
                        value={textBox.mvp}
                        onChange={(e) =>
                            setTextBox({
                                ...textBox,
                                mvp: e.target.value,
                            })
                        }
                        style={{ color: "black" }}
                    />
                </Form.Item>




            </Form>
        </div>
    )
}

export default MvpVisionDisplay