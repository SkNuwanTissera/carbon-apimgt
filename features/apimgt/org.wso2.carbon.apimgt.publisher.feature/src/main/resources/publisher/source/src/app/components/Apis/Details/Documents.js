/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, {Component} from 'react'
import API from '../../../data/api.js'
import {Button, Row, Col, Form, Input, Table, message, Popconfirm} from 'antd';

const FormItem = Form.Item;

/*
 Documents tab related React components.

 # Component hierarchy
 -Documents
 -DocumentsTable
 -NewDocDiv
 -NewDocInfoDiv
 -NewDocSourceDiv
 */
class Documents extends Component {
    constructor(props) {
        super(props);
        this.client = new API();
        this.api_id = this.props.match.params.api_uuid;
        this.state = {
            newDocName: "",
            documentId: "",
            newDocSourceType: "INLINE",
            newDocURL: "",
            newDocFilePath: null,
            addingNewDoc: false,
            newDocSummary: "",
            newDocFile: null,
            documentsList: null,
            updatingDoc: false
        };
        this.addNewDocBtnListner = this.addNewDocBtnListner.bind(this);
        this.handleNewDocInputChange = this.handleNewDocInputChange.bind(this);
        this.submitAddNewDocListner = this.submitAddNewDocListner.bind(this);
        this.cancelAddNewDocListner = this.cancelAddNewDocListner.bind(this);
        this.resetNewDocDetails = this.resetNewDocDetails.bind(this);
        this.deleteDocHandler = this.deleteDocHandler.bind(this);
        this.addNewDocBtnListner = this.addNewDocBtnListner.bind(this);
        this.editAPIDocumentListener = this.editAPIDocumentListener.bind(this);
        this.submitUpdateDocumentListener = this.submitUpdateDocumentListener.bind(this);
    }

    componentDidMount() {
        this.getDocumentsList();
    }

    getDocumentsList() {
        let docs = this.client.getDocuments(this.api_id);
        docs.catch(error_response => {
            let error_data = JSON.parse(error_response.data);
            let messageTxt = "Error[" + error_data.code + "]: " + error_data.description + " | " + error_data.message + ".";
            console.error(messageTxt);
            message.error("Error in fetching documents list of the API");
        }).then(response => {
            this.setState({documentsList: response.obj.list});
        });
    }

    addNewDocBtnListner() {
        if (!this.state.addingNewDoc) {
            this.setState({addingNewDoc: true});
        }
    }

    submitAddNewDocListner() {
        if (
            (this.state.newDocSourceType == null) || (this.state.newDocName == "") ||
            (this.state.newDocSourceType == "URL" && this.state.newDocURL == "") ||
            (this.state.newDocSourceType == "FILE" && this.state.newDocFile == null)
        ) {
            message.error("Enter the required details before adding the document");
            return;
        }

        var api_documents_data = {
            documentId: "",
            name: this.state.newDocName,
            type: "HOWTO",
            summary: this.state.newDocSummary,
            sourceType: this.state.newDocSourceType,
            sourceUrl: this.state.newDocURL,
            inlineContent: "string",
            permission: '[{"groupId" : "1000", "permission" : ["READ","UPDATE"]},{"groupId" : "1001", "permission" : ["READ","UPDATE"]}]',
            visibility: "API_LEVEL"
        }
        var promised_add = this.client.addDocument(this.api_id, api_documents_data);
        promised_add.catch(function (error) {
            var error_data = JSON.parse(error_response.data);
            var messageTxt = "Error[" + error_data.code + "]: " + error_data.description + " | " + error_data.message + ".";
            message.error(messageTxt);
        }).then((done) => {
            var dt_data = done.obj;
            var docId = dt_data.documentId;
            if (api_documents_data.sourceType == "FILE") {
                var file = this.state.newDocFile;
                var promised_add_file = this.client.addFileToDocument(this.api_id, docId, file);
                promised_add_file.catch(function (error) {
                    let error_data = JSON.parse(error_response.data);
                    let messageTxt = "Error[" + error_data.code + "]: " + error_data.description + " | " + error_data.message + ".";
                    console.error(messageTxt);
                    message.error("Failed adding file to the newly added document");
                });
            }
            api_documents_data.documentId = docId;
            var updatedDocList = this.state.documentsList;
            updatedDocList.push(api_documents_data);
            this.setState({
                documentsList: updatedDocList,
            });
            this.resetNewDocDetails();
            message.success("New document added successfully");
        });
    }

    handleNewDocInputChange(event) {
        const name = event.target.name;
        this.setState({
            [name]: event.target.value
        });
        if (event.target.type == "file") {
            this.setState({
                newDocFile: event.target.files[0]
            });
        }
    }

    cancelAddNewDocListner() {
        this.resetNewDocDetails();
    }

    resetNewDocDetails() {
        this.setState({
            newDocName: "",
            newDocSourceType: "INLINE",
            newDocURL: "",
            newDocFilePath: null,
            addingNewDoc: false,
            newDocSummary: "",
            newDocFile: null,
        });
    }

    deleteDocHandler(documentID) {
        let promised_delete = this.client.deleteDocument(this.api_id, documentID);
        promised_delete.then(
            (response) => {
                if (!response) {
                    return;
                }
                this.getDocumentsList();
            }
        );
    }

    editAPIDocumentListener(document) {
        this.setState({
            documentId: document.documentId,
            newDocName: document.name,
            newDocSourceType: document.sourceType,
            newDocURL: document.sourceUrl,
            newDocFilePath: document.fileName,
            addingNewDoc: false,
            newDocSummary: document.summary,
            updatingDoc: true
        });
    }

    submitUpdateDocumentListener() {
        if (
            (this.state.newDocSourceType == null) || (this.state.newDocName == "") ||
            (this.state.newDocSourceType == "URL" && this.state.newDocURL == "") ||
            (this.state.newDocSourceType == "FILE" && this.state.newDocFile == null)
        ) {
            message.error("Enter the required details before adding the document");
            return;
        }

        var api_documents_data = {
            documentId: this.state.documentId,
            name: this.state.newDocName,
            type: "HOWTO",
            summary: this.state.newDocSummary,
            sourceType: this.state.newDocSourceType,
            sourceUrl: this.state.newDocURL,
            inlineContent: "string",
            permission: '[{"groupId" : "1000", "permission" : ["READ","UPDATE"]},{"groupId" : "1001", "permission" : ["READ","UPDATE"]}]',
            visibility: "API_LEVEL"
        }
        var promised_update = this.client.updateDocument(this.api_id, api_documents_data.documentId, api_documents_data);
        promised_update.catch(function (error_response) {
            let error_data = JSON.parse(error_response.data);
            let messageTxt = "Error[" + error_data.code + "]: " + error_data.description + " | " + error_data.message + ".";
            console.error(messageTxt);
            message.error(messageTxt);
        }).then((response) => {
            var dt_data = response.obj;
            var docId = dt_data.documentId;

            if (dt_data.sourceType == "FILE") {
                var promised_add_file = this.client.addFileToDocument(this.api_id, docId, this.state.newDocFile);
                promised_add_file.catch(() => {
                    var error_data = JSON.parse(error_response.data);
                    var messageTxt = "Error[" + error_data.code + "]: " + error_data.description + " | " + error_data.message + ".";
                    console.error(messageTxt);
                    message.error("Failed updating document file")
                });
            }
            this.resetNewDocDetails();
            this.setState({updatingDoc: false});
            this.getDocumentsList();
            message.success("Document updated successfully");
        });
    }

    render() {
        return (
            <div>
                <Button style={{marginBottom: 30}} onClick={this.addNewDocBtnListner}
                        type="primary">Add New Document</Button>
                <div>
                    {(this.state.addingNewDoc || this.state.updatingDoc) &&
                    <NewDocDiv
                        newDocName={this.state.newDocName}
                        newDocSummary={this.state.newDocSummary}
                        newDocURL={this.state.newDocURL}
                        newDocFilePath={this.state.newDocFilePath}
                        selectedSourceType={this.state.newDocSourceType}
                        newDocFile={this.state.newDocFile}
                        onNewDocInfoChange={this.handleNewDocInputChange}
                        onSubmitAddNewDoc={this.submitAddNewDocListner}
                        onCancelAddNewDoc={this.cancelAddNewDocListner}
                        onSubmitUpdateDoc={this.submitUpdateDocumentListener}
                        updatingDoc={this.state.updatingDoc}
                    />}
                </div>
                <hr color="#f2f2f2"/>
                {
                    (this.state.documentsList && (this.state.documentsList.length > 0) ) ? (
                        <DocumentsTable apiId={this.api_id} client={this.client}
                                        documentsList={this.state.documentsList}
                                        deleteDocHandler={this.deleteDocHandler}
                                        onEditAPIDocument={this.editAPIDocumentListener}

                        /> ) :
                        (<div style={{paddingTop: 20}}><p>No documents added into the API</p></div>)
                }
            </div>
        );
    }
}

class DocumentsTable extends Component {
    constructor(props) {
        super(props);
        this.columns = [{
            title: 'Name',
            dataIndex: 'name',
            key: 'name'
        }, {
            title: 'Source',
            dataIndex: 'sourceType',
            key: 'sourceType'
        }, {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            render: (text1, record) => (<div>
                <a href="#" onClick={() => this.props.onEditAPIDocument(record)}>Edit | </a>
                <a href="#">View | </a>
                <Popconfirm title="Are you sure you want to delete this document?"
                            onConfirm={() => this.props.deleteDocHandler(record.documentId)}
                            okText="Yes" cancelText="No">
                    <a href="#">Delete</a>
                </Popconfirm>
            </div>)
        }
        ];
    }

    render() {

        return (
            <div style={{paddingTop: 20}}>
                <h3 style={{paddingBottom: 15}}>Current Documents</h3>
                <Table dataSource={ this.props.documentsList } columns={this.columns}/>
            </div>
        );
    }
}

class NewDocDiv extends Component {
    constructor(props) {
        super(props);
        //this.state = {sourceURL: "", summary: "", sourceFile: ""};
    }

    render() {
        return (
            <div>
                <div>
                    <Row type="flex" gutter={80} style={{paddingTop: 10}}>
                        <Col span={6}>
                            <NewDocInfoDiv
                                onNewDocInfoChange={this.props.onNewDocInfoChange}
                                newDocName={this.props.newDocName}
                                newDocSummary={this.props.newDocSummary}
                                newDocURL={this.props.newDocURL}
                                newDocFilePath={this.props.newDocFilePath}
                                selectedSourceType={this.props.newDocSourceType}
                                updatingDoc={this.props.updatingDoc}
                            />
                        </Col>
                        <Col span={6}>
                            <NewDocSourceDiv
                                onNewDocInfoChange={this.props.onNewDocInfoChange}
                                selectedSourceType={this.props.selectedSourceType}
                                newDocFilePath={this.props.newDocFilePath}
                                newDocFile={this.props.newDocFile}
                                newDocURL={this.props.newDocURL}
                                updatingDoc={this.props.updatingDoc}
                            />
                        </Col>
                    </Row>
                </div>
                <div name="action-buttons" style={{paddingBottom: 20}}>
                    <Row gutter={1}>
                        <Col span={1}>
                            {
                                this.props.updatingDoc ? (
                                    <Button type="default" size="small"
                                            onClick={this.props.onSubmitUpdateDoc}>Update</Button>
                                ) : (
                                    <Button type="default" size="small"
                                            onClick={this.props.onSubmitAddNewDoc}>Add</Button>
                                )
                            }
                        </Col>
                        <Col span={1}>
                            <Button type="default" size="small"
                                    onClick={this.props.onCancelAddNewDoc}>Cancel</Button>
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }
}

class NewDocInfoDiv extends Component {
    constructor(props) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    handleInputChange(e) {
        this.props.onNewDocInfoChange(e);
    }

    render() {
        return (
            <div>
                <Row gutter={45} type="flex" style={{paddingBottom: 5, paddingLeft: 10}}
                     justify="space-around">
                    <Col>
                        <h4>Name*</h4>
                    </Col>
                    <Col span={30}>
                        {this.props.addingNewDoc ? (
                            <Input type="text" name="newDocName" onChange={this.handleInputChange}/>
                        ) :
                            (<Input type="text" name="newDocName" value={this.props.newDocName}
                                    readonly/>)
                        }
                    </Col>
                </Row>
                <Row gutter={45} type="flex" style={{paddingBottom: 20, paddingLeft: 10}}
                     justify="space-around">
                    <Col>
                        <h4>Summary</h4>
                    </Col>
                    <Col span={30}>
                        {this.props.addingNewDoc ? (
                            <Input type="textarea" cols={20} rows={4} name="newDocSummary"
                                   onChange={this.handleInputChange}></Input>
                        ) : ( <Input type="textarea" cols={20} rows={4} name="newDocSummary"
                                     onChange={this.handleInputChange}
                                     value={this.props.newDocSummary}></Input>)
                        }
                    </Col>
                </Row>
            </div>
        )
    }
}

class NewDocSourceDiv extends Component {
    constructor(props) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    handleInputChange(e) {
        this.props.onNewDocInfoChange(e);
    }

    render() {
        return (
            <div>
                <h4>Source</h4>
                <Form layout="vertical" style={{paddingTop: 5}}>
                    <FormItem style={{margin: 0}}>
                        <label>
                            <input type="radio" name="newDocSourceType" value="INLINE"
                                   checked={this.props.selectedSourceType == 'INLINE'}
                                   onClick={this.handleInputChange}/>
                            Inline
                        </label>
                    </FormItem>
                    <FormItem style={{margin: 0}}>
                        <label>
                            <input type="radio" name="newDocSourceType" value="URL"
                                   checked={this.props.selectedSourceType == 'URL'}
                                   onClick={this.handleInputChange}/>
                            URL
                        </label>
                        {this.props.selectedSourceType == "URL" &&
                        <Input type="text" name="newDocURL" onChange={this.handleInputChange}
                               value={this.props.newDocURL}/>
                        }
                    </FormItem>
                    <FormItem style={{margin: 0}}>
                        <label>
                            <input type="radio" name="newDocSourceType" value="FILE"
                                   checked={this.props.selectedSourceType == 'FILE'}
                                   onClick={this.handleInputChange}/>
                            File
                        </label>
                        {this.props.selectedSourceType == "FILE" &&
                        <div marginWidth={10}>
                            <form>
                                <div>
                                    <input type="file" name="newDocFilePath"
                                           onChange={this.handleInputChange}/>
                                </div>
                            </form>
                        </div>
                        }
                    </FormItem>
                </Form>
            </div>
        );
    }
}

class ActionsCellDiv extends Component {
    render() {
        return (
            <div></div>
        );
    }
}
export default Documents;