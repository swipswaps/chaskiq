
import React from  'react'
import {
  Paper,
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  FormControl,
  TextField,
  FormControlLabel,
  Checkbox,
  InputLabel,
  MenuItem,
  Select,
  Grid
} from '@material-ui/core'
import FormDialog from '../FormDialog'
import FieldRenderer from '../../shared/FormFields'
import { 
    AGENTS,
    ASSIGNMENT_RULES
} from "../../graphql/queries"

import {
  CREATE_ASSIGNMENT_RULE,
  EDIT_ASSIGNMENT_RULE,
  DELETE_ASSIGNMENT_RULE,
  UPDATE_RULE_PRIORITIES
} from '../../graphql/mutations'

import graphql from "../../graphql/client"
import serialize from 'form-serialize'

import {
  withRouter
} from 'react-router-dom'
import { connect } from 'react-redux'

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import {
  sortableContainer, 
  sortableElement,
  sortableHandle,
} from 'react-sortable-hoc';
import arrayMove from 'array-move';
import {InlineFilterDialog} from '../../components/segmentManager'
import SegmentItemButton from '../../components/segmentManager/itemButton'

const DragHandle = sortableHandle(() => <span>::</span>);

const SortableItem = sortableElement(({object, deleteRule, edit}) => (
    <ListItem>
        <DragHandle />

        <ListItemText primary={object.title} 
        secondary={object.agent.email} />

        <Button onClick={(e)=> {
          e.preventDefault()
          edit(object)}
        }>
          edit
        </Button>
        <Button onClick={(e)=>{
          e.preventDefault()
          deleteRule(object)
        }}>
          delete
        </Button>
    </ListItem>
));

const SortableContainer = sortableContainer(({children}) => {
  return <List>{children}</List>;
});

class AssigmentRules extends React.Component {

  state = {
    isOpen: false,
    currentRule: null,
    rules: []
  }

  componentDidMount(){
    this.getAssignmentRules()
  }

  onSortEnd = ({oldIndex, newIndex}) => {
    this.setState(({rules}) => ({
      rules: arrayMove(rules, oldIndex, newIndex),
    }), this.updatePriorities);
  };

  open  = () => this.setState({ isOpen: true });
  close = () => this.setState({ isOpen: false });

  definitions = () => {
    return [
      {
        name: "name",
        type: 'string',
        grid: { xs: 12, sm: 6 }
      },
      {
        name: "agent",
        type: 'select',
        options: ["dark", "light"],
        grid: { xs: 12, sm: 6 }
      },
    ]
  }

  updatePriorities = ()=>{
    graphql(UPDATE_RULE_PRIORITIES, {
      appKey: this.props.app.key,
      rules: this.state.rules
    }, {
      success: (data)=>{
      }
    })
  }

  submitAssignment = ()=>{
    if(this.state.currentRule){
      this.editAssignmentRule()
    }else{
      this.createAssignmentRule()
    }
  }

  getAssignmentRules = ()=>{
    graphql(ASSIGNMENT_RULES, {
      appKey: this.props.app.key,

    },{
      success: (data)=>{
        this.setState({rules: data.app.assignmentRules})
      },
      error: ()=>{
        debugger
      }
    })
  }

  createAssignmentRule = (opts)=>{
    const serializedData = serialize(this.refs.form, { hash: true, empty: true })

    graphql(CREATE_ASSIGNMENT_RULE, {
      appKey: this.props.app.key,
      title: serializedData["title"],
      agentId: serializedData["agent"],
      active:  serializedData["active"]
    }, {
      success: (data)=>{
        const rule = data.createAssignmentRule.assignmentRule
        this.setState({
          rules: this.state.rules.concat(rule), 
          isOpen: false
        })
      },
      error: ()=>{

      }
    })
  }

  editAssignmentRule = (opts)=>{
    const serializedData = serialize(this.refs.form, { hash: true, empty: true })

    graphql(EDIT_ASSIGNMENT_RULE, {
      appKey: this.props.app.key,
      ruleId: this.state.currentRule.id,
      title: serializedData["title"],
      agentId: serializedData["agent"],
      active:  serializedData["active"]
    }, {
      success: (data)=>{
        const rule = data.editAssignmentRule.assignmentRule
        const collection = this.state.rules.map((o)=>{
          if(o.id === rule.id){
            return rule
          } else {
            return o
          }
        })

        this.setState({
          rules: collection, 
          currentRule: null,
          isOpen: false
        })
      },
      error: ()=>{

      }
    })
  }

  deleteAssignmentRule = (opts)=>{
    graphql(DELETE_ASSIGNMENT_RULE, {
      appKey: this.props.app.key,
      ruleId: this.state.currentRule.id,
    }, {
      success: (data)=>{
        const rule = data.deleteAssignmentRule.assignmentRule
        const collection = this.state.rules.filter((o)=> o.id != rule.id)
        this.setState({rules: collection, currentRule: null})
      },
      error: ()=>{

      }
    })
  }

  edit = (rule)=>{
    this.setState({
      currentRule: rule,
      isOpen: true
    })
  }

  deleteRule = (rule)=>{
    this.setState({
      currentRule: rule
    }, this.deleteAssignmentRule )   
  }


  render(){
    const {isOpen} = this.state

    return <div style={{alignSelf: 'center'}}>
              <Paper style={{padding: '2em'}}>
                 <Typography variant="h5" component="h3">
                    Assigment Rules
                  </Typography>

                  <Typography component="p" >
                    incoming new conversations goes to:
                  </Typography>

                  <Button variant={"primary"} onClick={()=> 
                    this.setState({isOpen: true})}>
                    Create Rule
                  </Button>

                <SortableContainer 
                    onSortEnd={this.onSortEnd}
                    useDragHandle>
                    {this.state.rules.map((value, index) => (
                      <SortableItem 
                        key={`item-${index}`} 
                        index={index} 
                        value={value.id}
                        object={value}
                        edit={this.edit.bind(this)}
                        deleteRule={this.deleteRule.bind(this)} 
                      />
                    ))}
                </SortableContainer>
                
            

              </Paper>


              {isOpen && (
                <FormDialog 
                  open={isOpen}
                  //contentText={"lipsum"}
                  titleContent={"Save Assigment rule"}
                  formComponent={
                    //!loading ?
                      <form ref="form">

                       <AssignmentForm
                         rule={this.state.currentRule} 
                         {...this.props}
                       /> 

                      </form> 
                      //: <CircularProgress/>
                  }
                  dialogButtons={
                    <React.Fragment>
                      <Button onClick={this.close} color="primary">
                        Cancel
                      </Button>

                      <Button onClick={this.submitAssignment } 
                        zcolor="primary">
                        {this.state.currentRule ? 'update' : 'create'}
                      </Button>

                    </React.Fragment>
                  }
                  //actions={actions} 
                  //onClose={this.close} 
                  //heading={this.props.title}
                  >
                </FormDialog>
              )}
          </div>
  }
} 


function AssignmentForm(props){

  const {rule} = props

  const [agents, setAgents] = React.useState([])
  const [selected, setSelected] = React.useState(rule ? rule.agent.id : '')
  const [title, setTitle] = React.useState(rule ? rule.title : '')
  const [checked, setChecked] = React.useState('')
  const [predicates, setPredicates] = React.useState([])

  function getAgents(){
    graphql(AGENTS, {appKey: props.app.key }, {
      success: (data)=>{
        setAgents(data.app.agents)
      }, 
      error: (error)=>{

      }
    })
  }

  React.useEffect(() => {
    getAgents()
  }, [])

  function handleChange(e){
    setSelected(e.target.value)
  }

  function displayName(o){
    return o.attribute.split("_").join(" ")
  }

  function getTextForPredicate(o){
    if(o.type === "match"){
      return `Match ${o.value === "and" ? "all" : "any" } criteria`
    }else{
      return `${displayName(o)} ${o.comparison ? o.comparison : '' } ${o.value ? o.value : ''}`
    }
  }

  return (

    <Grid container spacing={3}>

      <Grid item>
        <InlineFilterDialog 
          addPredicate={()=>{}}
        />


        {
          predicates.map((o, i)=>{
              return <SegmentItemButton 
                      key={i}
                      index={i}
                      predicate={o}
                      predicates={predicates}
                      open={ !o.comparison }
                      appearance={ o.comparison ? "primary" : "default"} 
                      text={getTextForPredicate(o)}
                      updatePredicate={(items)=>{debugger}}
                      predicateCallback={(jwtToken)=> {} }
                      deletePredicate={()=>{}}                          
                     />
          })
        }

      </Grid>

      <Grid item
        //key={field.name} 
        xs={6} 
        sm={6}>

        <FormControl>
          <TextField
            label={'title'}
            name={"title"}
            //error={errorMessage}
            //variant="outlined"
            fullWidth
            //margin="normal"
            //name={`${namespace}[${data.name}]`}
            //defaultValue={} 
            value={title}
            onChange={(e)=> setTitle(e.target.value)}
            helperText={"ssdds"}
          />
        </FormControl>

      </Grid>

      <Grid item
        //key={field.name} 
        xs={6} 
        sm={6}>


        {
          agents.length > 0 ?
        
          <FormControl>
            <InputLabel htmlFor="agent">agent</InputLabel>
            <Select
              value={selected}
              onChange={handleChange}
              inputProps={{
                name: 'agent',
                id: 'agent',
              }}
            >

              {
                agents.map((o)=>(
                  <MenuItem value={o.id}>
                    {o.email}
                  </MenuItem>
                ))
              }

            </Select>
          </FormControl> : null

        }

      </Grid>

      <Grid item
        //key={field.name} 
        xs={12} 
        sm={12}>

        <FormControlLabel 
          control={<Checkbox 
             name={"active"}
             value={checked}
             onChange={(e)=> setChecked(e.target.checked)}
          />} 
          label="Activate" 
        />

      </Grid>

    </Grid>

  )

}



function mapStateToProps(state) {

  const { auth, app, conversations, app_user } = state
  const { loading, isAuthenticated } = auth
  //const { sort, filter, collection , meta, loading} = conversations

  return {
    conversations,
    app_user,
    app,
    isAuthenticated
  }
}

export default withRouter(connect(mapStateToProps)(AssigmentRules))


